import React from 'react';
import {
  Box,
  Radio,
  RadioGroup,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  VStack,
  Divider,
} from '@chakra-ui/react';
import { useStore } from '../store/useStore';
import { LeadTimeStats } from '../types';

interface ControlsProps {
  leadTimeStats?: LeadTimeStats;
}

const Controls: React.FC<ControlsProps> = ({ leadTimeStats }) => {
  const { displayMetric, pathThreshold, setDisplayMetric, setPathThreshold } = useStore();

  return (
    <Box p={4} bg="gray.50" borderRadius="md" shadow="md" minW="250px">
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={2}>
            表示メトリクス
          </Text>
          <RadioGroup
            value={displayMetric}
            onChange={(value) => setDisplayMetric(value as 'frequency' | 'performance')}
          >
            <Stack direction="column" spacing={2}>
              <Radio value="frequency">頻度</Radio>
              <Radio value="performance">平均待機時間</Radio>
            </Stack>
          </RadioGroup>
        </Box>

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={2}>
            パスフィルター閾値
          </Text>
          <Slider
            value={pathThreshold}
            onChange={setPathThreshold}
            min={0}
            max={1}
            step={0.01}
            colorScheme="blue"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text fontSize="sm" color="gray.600" mt={1}>
            最大頻度の {(pathThreshold * 100).toFixed(0)}% 以上のパスを表示
          </Text>
        </Box>

        {leadTimeStats && leadTimeStats.lead_time_hours.median !== null && (
          <>
            <Divider />
            <Box>
              <Text fontWeight="bold" mb={2}>
                📊 リードタイム統計
              </Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text fontWeight="semibold">全ケース:</Text>
                <Text ml={2}>ケース数: {leadTimeStats.case_count}件</Text>
                <Text ml={2}>最小: {leadTimeStats.lead_time_hours.min?.toFixed(1)}時間</Text>
                <Text ml={2}>中央値: {leadTimeStats.lead_time_hours.median?.toFixed(1)}時間</Text>
                <Text ml={2}>最大: {leadTimeStats.lead_time_hours.max?.toFixed(1)}時間</Text>

                {leadTimeStats.happy_path && leadTimeStats.happy_path.case_count > 0 && (
                  <>
                    <Text mt={2} fontWeight="semibold">✨ ハッピーパス:</Text>
                    <Text ml={2} fontSize="xs" color="gray.600">
                      ({leadTimeStats.happy_path.path.join(' → ')})
                    </Text>
                    <Text ml={2}>ケース数: {leadTimeStats.happy_path.case_count}件</Text>
                    <Text ml={2}>最小: {leadTimeStats.happy_path.lead_time_hours.min?.toFixed(1)}時間</Text>
                    <Text ml={2}>中央値: {leadTimeStats.happy_path.lead_time_hours.median?.toFixed(1)}時間</Text>
                    <Text ml={2}>最大: {leadTimeStats.happy_path.lead_time_hours.max?.toFixed(1)}時間</Text>
                  </>
                )}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default Controls;
