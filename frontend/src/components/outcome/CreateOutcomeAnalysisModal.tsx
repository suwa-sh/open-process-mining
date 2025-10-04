/**
 * Create outcome analysis modal
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
import { useOutcomeStore } from '../../stores/outcomeStore';
import { fetchProcessTypes } from '../../api/outcomeApi';

interface CreateOutcomeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateOutcomeAnalysisModal: React.FC<CreateOutcomeAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { availableMetrics, fetchMetrics, createAnalysis, loading } = useOutcomeStore();

  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [analysisName, setAnalysisName] = useState('');
  const [processType, setProcessType] = useState('');
  const [metricName, setMetricName] = useState('');
  const [analysisType, setAnalysisType] = useState<'path-outcome' | 'segment-comparison'>('path-outcome');
  const [segmentMode, setSegmentMode] = useState<'top25' | 'bottom25' | 'threshold'>('top25');
  const [threshold, setThreshold] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'all' | 'start_date' | 'end_date'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // プロセスタイプ一覧を取得
  useEffect(() => {
    const loadProcessTypes = async () => {
      try {
        const types = await fetchProcessTypes();
        setProcessTypes(types);
        if (types.length > 0 && !processType) {
          setProcessType(types[0]);
        }
      } catch (error) {
        console.error('Failed to fetch process types', error);
      }
    };

    if (isOpen) {
      loadProcessTypes();
    }
  }, [isOpen]);

  // プロセスタイプが変更されたらメトリックをフェッチ
  useEffect(() => {
    if (isOpen && processType) {
      fetchMetrics(processType);
    }
  }, [isOpen, processType, fetchMetrics]);

  // メトリック一覧が更新されたら最初のメトリックを選択
  useEffect(() => {
    if (availableMetrics.length > 0) {
      setMetricName(availableMetrics[0].metric_name);
    } else {
      setMetricName('');
    }
  }, [availableMetrics]);

  // 分析名のデフォルト値を生成
  useEffect(() => {
    if (processType && metricName && analysisType) {
      const today = new Date().toISOString().split('T')[0];
      const typeLabel = analysisType === 'path-outcome' ? 'パス別成果' : 'セグメント比較';
      setAnalysisName(`${processType}_${metricName}_${typeLabel}_${today}`);
    }
  }, [processType, metricName, analysisType]);

  const handleProcessTypeChange = (newProcessType: string) => {
    setProcessType(newProcessType);
  };

  const handleSubmit = async () => {
    if (!analysisName || !processType || !metricName) {
      toast({
        title: '入力エラー',
        description: 'すべての項目を入力してください',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (analysisType === 'segment-comparison' && segmentMode === 'threshold' && threshold === 0) {
      toast({
        title: '入力エラー',
        description: '閾値を設定してください',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if ((filterMode === 'start_date' || filterMode === 'end_date') && (!dateFrom || !dateTo)) {
      toast({
        title: '入力エラー',
        description: '日付範囲を指定してください',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const filterConfig: Record<string, unknown> = {};

      if (analysisType === 'segment-comparison') {
        filterConfig.segment_mode = segmentMode;
        if (segmentMode === 'threshold') {
          filterConfig.threshold = threshold;
        }
      }

      const analysisId = await createAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        metric_name: metricName,
        analysis_type: analysisType,
        filter_config: Object.keys(filterConfig).length > 0 ? filterConfig : undefined,
        date_from: (filterMode === 'start_date' || filterMode === 'end_date') ? dateFrom : undefined,
        date_to: (filterMode === 'start_date' || filterMode === 'end_date') ? dateTo : undefined,
      });

      toast({
        title: '成果分析を作成しました',
        status: 'success',
        duration: 3000,
      });

      onClose();
      navigate(`/outcome/${analysisId}`);
    } catch (error) {
      toast({
        title: '成果分析の作成に失敗しました',
        description: error instanceof Error ? error.message : '不明なエラー',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>新規成果分析作成</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>分析名</FormLabel>
              <Input
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="例: 受注金額分析_2025-10"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>プロセスタイプ</FormLabel>
              <Select
                value={processType}
                onChange={(e) => handleProcessTypeChange(e.target.value)}
              >
                {processTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>メトリック</FormLabel>
              <Select
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                isDisabled={availableMetrics.length === 0}
              >
                {availableMetrics.map((metric) => (
                  <option key={metric.metric_name} value={metric.metric_name}>
                    {metric.metric_name} ({metric.metric_unit})
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>分析タイプ</FormLabel>
              <Select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as 'path-outcome' | 'segment-comparison')}
              >
                <option value="path-outcome">パス別成果分析</option>
                <option value="segment-comparison">セグメント比較分析</option>
              </Select>
            </FormControl>

            {analysisType === 'segment-comparison' && (
              <>
                <FormControl isRequired>
                  <FormLabel>セグメント条件</FormLabel>
                  <Select
                    value={segmentMode}
                    onChange={(e) => setSegmentMode(e.target.value as 'top25' | 'bottom25' | 'threshold')}
                  >
                    <option value="top25">上位25%</option>
                    <option value="bottom25">下位25%</option>
                    <option value="threshold">閾値指定</option>
                  </Select>
                </FormControl>

                {segmentMode === 'threshold' && (
                  <FormControl isRequired>
                    <FormLabel>閾値</FormLabel>
                    <NumberInput
                      value={threshold}
                      onChange={(_, valueAsNumber) => setThreshold(valueAsNumber)}
                      min={0}
                    >
                      <NumberInputField placeholder="例: 1000000" />
                    </NumberInput>
                  </FormControl>
                )}
              </>
            )}

            <FormControl>
              <FormLabel>分析対象期間の基準</FormLabel>
              <RadioGroup value={filterMode} onChange={(value) => setFilterMode(value as 'all' | 'start_date' | 'end_date')}>
                <Stack>
                  <Radio value="all">すべての期間を含める</Radio>
                  <Radio value="start_date">ケース開始日で絞り込む（推奨）</Radio>
                  <Radio value="end_date">ケース完了日で絞り込む</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {(filterMode === 'start_date' || filterMode === 'end_date') && (
              <FormControl>
                <FormLabel>対象期間</FormLabel>
                <HStack>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Text>〜</Text>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </HStack>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  ℹ️ 指定期間のイベントのみを対象に分析します
                </Text>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
          >
            作成
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateOutcomeAnalysisModal;
