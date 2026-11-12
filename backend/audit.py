import json

import models


def record(db, actor, action, target_type, target_id, project_id=None, details=None):
    db.add(models.AuditEvent(
        actor_id=actor.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        project_id=project_id,
        details=json.dumps(details or {}, ensure_ascii=False),
    ))
