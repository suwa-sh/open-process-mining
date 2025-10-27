import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Box } from "@mui/material";

/**
 * End Node Component for UML Activity Diagram
 * Displays as a black filled circle inside a hollow circle (final node)
 */
const EndNode: React.FC = () => {
  return (
    <Box
      sx={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        border: "2px solid black",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
      }}
    >
      <Box
        sx={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "black",
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
    </Box>
  );
};

export default React.memo(EndNode);
