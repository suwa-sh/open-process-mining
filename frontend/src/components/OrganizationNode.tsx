import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Text } from '@chakra-ui/react';

interface OrganizationNodeProps {
  data: {
    label: string;
    frequency: number;
  };
}

const OrganizationNode: React.FC<OrganizationNodeProps> = ({ data }) => {
  return (
    <Box
      borderWidth={2}
      borderColor="blue.500"
      borderRadius="md"
      bg="white"
      p={4}
      minW="150px"
      textAlign="center"
      boxShadow="md"
      _hover={{ boxShadow: 'lg' }}
    >
      <Handle type="target" position={Position.Top} />
      <Text fontWeight="bold" fontSize="md" mb={1}>
        {data.label}
      </Text>
      <Text fontSize="sm" color="gray.600">
        {data.frequency} 件
      </Text>
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
};

export default memo(OrganizationNode);
