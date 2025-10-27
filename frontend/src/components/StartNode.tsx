import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Box } from "@mui/material";

/**
 * Start Node Component for UML Activity Diagram
 * Displays as a black filled circle (initial node)
 */
const StartNode: React.FC = () => {
  return (
    <Box
      sx={{
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        backgroundColor: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />
    </Box>
  );
};

export default React.memo(StartNode);
