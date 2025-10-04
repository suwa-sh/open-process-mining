import React, { useState, useEffect } from 'react';
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
  Radio,
  RadioGroup,
  Text,
  VStack,
  HStack,
  Box,
  useToast,
} from '@chakra-ui/react';
import { createOrganizationAnalysis, getProcessTypes } from '../api/client';
import { FilterMode } from '../types';

interface CreateOrganizationAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analysisId: string) => void;
}

const CreateOrganizationAnalysisModal: React.FC<CreateOrganizationAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [processType, setProcessType] = useState<string>('');
  const [analysisName, setAnalysisName] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // プロセスタイプ一覧を取得
  useEffect(() => {
    const fetchProcessTypes = async () => {
      try {
        const types = await getProcessTypes();
        setProcessTypes(types);
        if (types.length > 0) {
          setProcessType(types[0]);
        }
      } catch (error) {
        console.error('Failed to fetch process types', error);
      }
    };

    if (isOpen) {
      fetchProcessTypes();
    }
  }, [isOpen]);

  // プロセスタイプ変更時に分析名を自動生成
  useEffect(() => {
    if (processType) {
      const today = new Date().toISOString().split('T')[0];
      setAnalysisName(`${processType}_${today}`);
    }
  }, [processType]);

  const handleSubmit = async () => {
    if (!analysisName || !processType) {
      toast({
        title: '入力エラー',
        description: '分析名とプロセスタイプを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (filterMode !== 'all' && (!dateFrom || !dateTo)) {
      toast({
        title: '入力エラー',
        description: '日付範囲を指定してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createOrganizationAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        aggregation_level: 'employee', // デフォルトは社員別（詳細画面で切り替え可能）
        filter_mode: filterMode,
        date_from: filterMode !== 'all' ? dateFrom : undefined,
        date_to: filterMode !== 'all' ? dateTo : undefined,
      });

      toast({
        title: '組織分析を作成しました',
        description: `${result.node_count}ノード、${result.resource_count}リソースの分析を作成しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess(result.analysis_id);
      onClose();
    } catch (error: any) {
      toast({
        title: '分析実行エラー',
        description: error.response?.data?.detail || '分析の実行に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>新規組織分析を作成</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>分析名</FormLabel>
              <Input
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="例: employee-onboarding_組織分析_2025-10-04"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>プロセスタイプ</FormLabel>
              <Select value={processType} onChange={(e) => setProcessType(e.target.value)}>
                {processTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>分析対象期間の基準</FormLabel>
              <RadioGroup value={filterMode} onChange={(value) => setFilterMode(value as FilterMode)}>
                <VStack align="start">
                  <Radio value="all">すべての期間を含める</Radio>
                  <Radio value="case_start">ケース開始日で絞り込む（推奨）</Radio>
                  <Radio value="case_end">ケース完了日で絞り込む</Radio>
                </VStack>
              </RadioGroup>
            </FormControl>

            {filterMode !== 'all' && (
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
                  ℹ️ 期間外のイベントもケースに含まれる場合があります。
                </Text>
              </FormControl>
            )}

            <Box borderWidth={1} borderRadius="md" p={4} bg="purple.50">
              <Text fontWeight="bold" mb={2} color="purple.900">
                📊 組織分析について
              </Text>
              <VStack align="start" spacing={1} fontSize="sm" color="purple.800">
                <Text>• ハンドオーバー分析: 誰と誰が連携しているか</Text>
                <Text>• 作業負荷分析: 誰の作業量が多いか</Text>
                <Text>• パフォーマンス分析: 誰の処理時間が長いか</Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
            キャンセル
          </Button>
          <Button colorScheme="purple" onClick={handleSubmit} isLoading={isSubmitting}>
            分析を実行
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateOrganizationAnalysisModal;
