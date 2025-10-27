import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Paper, Typography } from "@mui/material";

interface ActionNodeProps {
  data: {
    label: string;
    frequency: number;
  };
}

const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        border: 2,
        borderColor: "primary.main",
        borderRadius: 1,
        bgcolor: "white",
        p: 2,
        minWidth: "150px",
        textAlign: "center",
        "&:hover": { boxShadow: 6 },
      }}
    >
      {/* 通常の縦方向フローのハンドル */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {/* バックエッジ用の横方向ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ opacity: 0 }}
      />

      <Typography variant="body1" fontWeight="bold" mb={0.5}>
        {data.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {data.frequency} 件
      </Typography>
    </Paper>
  );
};

export default memo(ActionNode);
