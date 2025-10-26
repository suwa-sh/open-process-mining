import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Paper, Typography } from "@mui/material";

interface OrganizationNodeProps {
  data: {
    label: string;
    frequency: number;
  };
}

const OrganizationNode: React.FC<OrganizationNodeProps> = ({ data }) => {
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
      <Handle type="target" position={Position.Top} />
      <Typography variant="body1" fontWeight="bold" mb={0.5}>
        {data.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {data.frequency} 件
      </Typography>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(OrganizationNode);
