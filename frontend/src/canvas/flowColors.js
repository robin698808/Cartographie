export const DEFAULT_FLOW_DIRECTION_COLORS={incoming:"#38BDF8",outgoing:"#34D399"};

export function defaultFlowColor(isDark) {
  return isDark?"#B9C4FF":"#334155";
}

export function flowStrokeOpacity(isSelected) {
  return isSelected?1:0.82;
}

export function normalizeFlowDirectionColors(value) {
  const valid=color=>typeof color==="string"&&/^#[0-9a-f]{6}$/i.test(color);
  return {
    incoming:valid(value?.incoming)?value.incoming:DEFAULT_FLOW_DIRECTION_COLORS.incoming,
    outgoing:valid(value?.outgoing)?value.outgoing:DEFAULT_FLOW_DIRECTION_COLORS.outgoing,
  };
}

export function flowDirectionColor(flow, referenceApp, colors, fallback) {
  if(referenceApp!=null&&flow.from===referenceApp)return colors.outgoing;
  if(referenceApp!=null&&flow.to===referenceApp)return colors.incoming;
  return fallback;
}
