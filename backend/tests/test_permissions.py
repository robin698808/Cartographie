import os
import sys
import tempfile
import unittest
import gc
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect, text
from starlette.websockets import WebSocketDisconnect

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
TEMP = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(TEMP.name) / "permissions.db").replace("\\", "/")

original_cwd = os.getcwd()
try:
    os.chdir(TEMP.name)
    import auth
    import models
    from database import Base, SessionLocal, engine
    if Path(engine.url.database).resolve() != (Path(TEMP.name) / "permissions.db").resolve():
        raise RuntimeError("Les tests nécessitent une base temporaire isolée")
    from main import app, run_migrations
    from routes import projects
    import schemas
finally:
    os.chdir(original_cwd)

def tearDownModule():
    gc.collect()
    engine.dispose()
    TEMP.cleanup()


class PermissionTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        run_migrations(engine)
        self.client = TestClient(app)
        with SessionLocal() as db:
            for name, role in [("admin", "admin"), ("owner", "member"), ("editor", "member"), ("reader", "viewer"), ("other", "member")]:
                db.add(models.User(email=name + "@example.com", nom=name, hashed_password="unused", role=models.UserRole(role)))
            db.commit()
            self.ids = {u.nom: u.id for u in db.query(models.User).all()}
        self.tokens = {name: auth.create_access_token({"sub": str(uid)}) for name, uid in self.ids.items()}
        r = self.request("owner", "post", "/api/projects", json={"nom": "Test"})
        self.assertEqual(r.status_code, 201, r.text)
        self.project = r.json()["id"]
        self.member("editor", "editor")
        self.member("reader", "viewer")

    def tearDown(self):
        self.client.close()

    def request(self, name, method, path, **kwargs):
        return self.client.request(method, path, headers={"Authorization": "Bearer " + self.tokens[name]}, **kwargs)

    def member(self, name, role):
        r = self.request("owner", "post", f"/api/projects/{self.project}/members",
                         json={"email": name + "@example.com", "role": role})
        self.assertEqual(r.status_code, 201, r.text)

    def test_project_roles_and_global_ceiling(self):
        project = f"/api/projects/{self.project}"
        snap = {"apps": [], "flows": [], "dom_colors": {}}
        self.assertEqual(self.request("reader", "post", project + "/snapshots", json=snap).status_code, 403)
        self.assertEqual(self.request("editor", "post", project + "/snapshots", json=snap).status_code, 201)
        self.assertEqual(self.request("editor", "patch", project, json={"nom": "New"}).status_code, 403)
        self.assertEqual(self.request("admin", "patch", project, json={"nom": "New"}).status_code, 200)
        self.assertEqual(self.request("other", "get", project).status_code, 403)
        self.assertEqual(self.request("reader", "post", "/api/projects", json={"nom": "No"}).status_code, 403)
        self.assertEqual(self.request("owner", "patch", project + f"/members/{self.ids['reader']}", json={"role": "editor"}).status_code, 400)
        self.assertEqual(self.request("owner", "post", project + "/members", json={"email": "other@example.com", "role": "owner"}).status_code, 400)
        self.assertEqual(self.request("admin", "delete", f"/api/users/{self.ids['owner']}").status_code, 409)
        with SessionLocal() as db:
            member = db.query(models.ProjectMember).filter_by(project_id=self.project, user_id=self.ids["reader"]).one()
            member.role = models.MemberRole.editor
            db.commit()
        self.assertEqual(self.request("reader", "get", project).json()["effective_role"], "viewer")
        self.assertEqual(self.request("reader", "post", project + "/snapshots", json=snap).status_code, 403)

    def test_owner_transfer_and_demotion(self):
        project = f"/api/projects/{self.project}"
        self.assertEqual(self.request("owner", "patch", project + f"/members/{self.ids['editor']}", json={"role": "owner"}).status_code, 400)
        self.assertEqual(self.request("admin", "patch", f"/api/users/{self.ids['owner']}", json={"role": "viewer"}).status_code, 409)
        self.assertEqual(self.request("owner", "post", project + "/transfer-ownership", json={"user_id": self.ids["reader"]}).status_code, 400)
        self.assertEqual(self.request("owner", "post", project + "/transfer-ownership", json={"user_id": self.ids["editor"]}).status_code, 200)
        self.assertEqual(self.request("owner", "delete", project).status_code, 403)
        self.assertEqual(self.request("admin", "patch", f"/api/users/{self.ids['owner']}", json={"role": "viewer"}).status_code, 200)
        self.assertEqual(self.request("owner", "get", project).json()["effective_role"], "viewer")
        with SessionLocal() as db:
            p = db.get(models.Project, self.project)
            owners = [m.user_id for m in p.members if m.role == models.MemberRole.owner]
            self.assertEqual(owners, [self.ids["editor"]])
            self.assertEqual(p.owner_id, self.ids["editor"])
            self.assertTrue(db.query(models.AuditEvent).filter_by(action="project.ownership_transferred").first())

    def test_owner_index_rejects_duplicate(self):
        with SessionLocal() as db:
            member = db.query(models.ProjectMember).filter_by(project_id=self.project, user_id=self.ids["editor"]).one()
            member.role = models.MemberRole.owner
            with self.assertRaises(IntegrityError):
                db.commit()
            db.rollback()

    def test_existing_duplicate_owners_are_not_silently_modified(self):
        with engine.begin() as conn:
            conn.execute(text("DROP INDEX uq_project_single_owner"))
            conn.execute(text("UPDATE project_members SET role = 'owner' WHERE project_id = :project AND user_id = :user"),
                         {"project": self.project, "user": self.ids["editor"]})
        with self.assertLogs("main", level="WARNING") as logs:
            run_migrations(engine)
        self.assertIn("plusieurs propriétaires", " ".join(logs.output))
        self.assertNotIn("uq_project_single_owner", [i["name"] for i in inspect(engine).get_indexes("project_members")])
        with SessionLocal() as db:
            owners = db.query(models.ProjectMember).filter_by(project_id=self.project, role=models.MemberRole.owner).count()
            self.assertEqual(owners, 2)

    def test_simultaneous_transfers_reject_stale_owner(self):
        self.member("other", "editor")
        barrier = threading.Barrier(2)
        local = threading.local()
        original = projects.get_project_or_404

        def synchronized_load(project_id, db):
            project = original(project_id, db)
            if not getattr(local, "loaded", False):
                local.loaded = True
                barrier.wait(timeout=10)
            return project

        def transfer(target):
            with SessionLocal() as db:
                try:
                    projects.transfer_ownership(
                        self.project, schemas.TransferOwnership(user_id=self.ids[target]),
                        db, db.get(models.User, self.ids["admin"])
                    )
                    return 200
                except HTTPException as exc:
                    return exc.status_code

        with patch.object(projects, "get_project_or_404", synchronized_load):
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(transfer, ["editor", "other"]))
        self.assertEqual(sorted(results), [200, 409])
        with SessionLocal() as db:
            project = db.get(models.Project, self.project)
            owners = [m.user_id for m in project.members if m.role == models.MemberRole.owner]
            self.assertEqual(owners, [project.owner_id])
            self.assertEqual(db.query(models.AuditEvent).filter_by(action="project.ownership_transferred").count(), 1)

    def test_views_and_privacy(self):
        path = f"/api/projects/{self.project}/views"
        private = self.request("reader", "post", path, json={"name": "Privée", "shared": False, "data": {}})
        self.assertEqual(private.status_code, 201)
        pid = private.json()["id"]
        self.assertEqual(self.request("admin", "patch", f"{path}/{pid}", json={"name": "Non"}).status_code, 403)
        self.assertEqual(self.request("admin", "get", path).json(), [])
        self.assertEqual(self.request("reader", "post", path, json={"name": "Non", "shared": True, "data": {}}).status_code, 403)
        shared = self.request("editor", "post", path, json={"name": "Partagée", "shared": True, "data": {}}).json()
        self.assertEqual(self.request("admin", "patch", f"/api/users/{self.ids['editor']}", json={"role": "viewer"}).status_code, 200)
        self.assertEqual(self.request("editor", "patch", f"{path}/{shared['id']}", json={"name": "Non"}).status_code, 403)
        self.assertEqual(self.request("editor", "delete", f"{path}/{shared['id']}").status_code, 403)
        self.assertEqual(self.request("editor", "get", path).status_code, 200)

    def test_websocket_reader_cannot_broadcast_mutations(self):
        with self.client.websocket_connect(f"/ws/{self.project}?token={self.tokens['reader']}") as ws:
            self.assertEqual(ws.receive_json()["type"], "presence_init")
            ws.send_json({"type": "apps_update", "payload": {}})
            self.assertEqual(ws.receive_json()["type"], "error")

    def test_websocket_closes_after_role_change(self):
        with self.client.websocket_connect(f"/ws/{self.project}?token={self.tokens['editor']}") as ws:
            self.assertEqual(ws.receive_json()["type"], "presence_init")
            r = self.request("owner", "patch", f"/api/projects/{self.project}/members/{self.ids['editor']}", json={"role": "viewer"})
            self.assertEqual(r.status_code, 200)
            with self.assertRaises(WebSocketDisconnect) as closed:
                ws.receive_json()
            self.assertEqual(closed.exception.code, 4003)

    def test_websocket_closes_after_member_removal(self):
        with self.client.websocket_connect(f"/ws/{self.project}?token={self.tokens['editor']}") as ws:
            self.assertEqual(ws.receive_json()["type"], "presence_init")
            r = self.request("owner", "delete", f"/api/projects/{self.project}/members/{self.ids['editor']}")
            self.assertEqual(r.status_code, 204)
            with self.assertRaises(WebSocketDisconnect) as closed:
                ws.receive_json()
            self.assertEqual(closed.exception.code, 4003)


if __name__ == "__main__":
    unittest.main()
