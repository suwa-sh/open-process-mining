import React, { useState, useEffect } from "react";
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
  Stack,
  Text,
  VStack,
  HStack,
  Box,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import {
  createAnalysis,
  getAnalysisPreview,
  getProcessTypes,
  getLeadTimeStats,
} from "../api/client";
import { FilterMode, PreviewResponse, LeadTimeStats } from "../types";

interface CreateAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analysisId: string) => void;
}

const CreateAnalysisModal: React.FC<CreateAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [processType, setProcessType] = useState<string>("");
  const [analysisName, setAnalysisName] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [leadTimeStats, setLeadTimeStats] = useState<LeadTimeStats | null>(
    null,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
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
        console.error("Failed to fetch process types", error);
      }
    };

    if (isOpen) {
      fetchProcessTypes();
    }
  }, [isOpen]);

  // プロセスタイプ変更時に分析名を自動生成
  useEffect(() => {
    if (processType) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      setAnalysisName(`${processType}_${dateStr}`);
    }
  }, [processType]);

  // プレビュー取得（デバウンス）
  useEffect(() => {
    if (!processType) return;

    const timer = setTimeout(async () => {
      try {
        setIsLoadingPreview(true);
        const [previewData, statsData] = await Promise.all([
          getAnalysisPreview(
            processType,
            filterMode,
            dateFrom || undefined,
            dateTo || undefined,
          ),
          getLeadTimeStats(
            processType,
            filterMode,
            dateFrom || undefined,
            dateTo || undefined,
          ),
        ]);
        setPreview(previewData);
        setLeadTimeStats(statsData);
      } catch (error) {
        console.error("Failed to fetch preview", error);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [processType, filterMode, dateFrom, dateTo]);

  const handleSubmit = async () => {
    if (!analysisName || !processType) {
      toast({
        title: "入力エラー",
        description: "分析名とプロセスタイプを入力してください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (filterMode !== "all" && (!dateFrom || !dateTo)) {
      toast({
        title: "入力エラー",
        description: "日付範囲を指定してください",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        filter_mode: filterMode,
        date_from: filterMode !== "all" ? dateFrom : undefined,
        date_to: filterMode !== "all" ? dateTo : undefined,
      });

      toast({
        title: "分析を作成しました",
        description: `${result.event_count}件のイベント、${result.case_count}件のケースを分析しました`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onSuccess(result.analysis_id);
      onClose();
    } catch (error: any) {
      toast({
        title: "分析実行エラー",
        description: error.response?.data?.detail || "分析の実行に失敗しました",
        status: "error",
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
        <ModalHeader>新規分析を作成</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>分析名</FormLabel>
              <Input
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
                placeholder="例: 受注から配送_2025-10"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>プロセスタイプ</FormLabel>
              <Select
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
              >
                {processTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>分析対象期間の基準</FormLabel>
              <RadioGroup
                value={filterMode}
                onChange={(value) => setFilterMode(value as FilterMode)}
              >
                <Stack>
                  <Radio value="all">すべての期間を含める</Radio>
                  <Radio value="case_start">
                    ケース開始日で絞り込む（推奨）
                  </Radio>
                  <Radio value="case_end">ケース完了日で絞り込む</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {filterMode !== "all" && (
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

            <Box borderWidth={1} borderRadius="md" p={4} bg="gray.50">
              <Text fontWeight="bold" mb={2}>
                📊 プレビュー
              </Text>
              {isLoadingPreview ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text>読み込み中...</Text>
                </HStack>
              ) : preview ? (
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text>対象ケース数: {preview.case_count}件</Text>
                  <Text>対象イベント数: {preview.event_count}件</Text>
                  {leadTimeStats &&
                    leadTimeStats.lead_time_hours.median !== null && (
                      <>
                        <Text fontWeight="bold" mt={2}>
                          リードタイム（開始〜終了）:
                        </Text>
                        <Text ml={2}>
                          最小: {leadTimeStats.lead_time_hours.min?.toFixed(1)}
                          時間
                        </Text>
                        <Text ml={2}>
                          中央値:{" "}
                          {leadTimeStats.lead_time_hours.median?.toFixed(1)}時間
                        </Text>
                        <Text ml={2}>
                          最大: {leadTimeStats.lead_time_hours.max?.toFixed(1)}
                          時間
                        </Text>
                        {leadTimeStats.happy_path &&
                          leadTimeStats.happy_path.case_count > 0 && (
                            <>
                              <Text fontWeight="bold" mt={2}>
                                ✨ ハッピーパス:
                              </Text>
                              <Text ml={2} fontSize="xs" color="gray.600">
                                {leadTimeStats.happy_path.path.join(" → ")}
                              </Text>
                              <Text ml={2}>
                                {leadTimeStats.happy_path.case_count}件のケース
                              </Text>
                              <Text ml={2}>
                                中央値:{" "}
                                {leadTimeStats.happy_path.lead_time_hours.median?.toFixed(
                                  1,
                                )}
                                時間
                              </Text>
                            </>
                          )}
                      </>
                    )}
                  {filterMode !== "all" && (
                    <>
                      <Text mt={2}>
                        ケース{filterMode === "case_start" ? "開始" : "完了"}
                        期間: {dateFrom} 〜 {dateTo}
                      </Text>
                      {preview.date_range.min && preview.date_range.max && (
                        <Text>
                          実際のイベント期間:{" "}
                          {new Date(preview.date_range.min).toLocaleDateString(
                            "ja-JP",
                          )}{" "}
                          〜{" "}
                          {new Date(preview.date_range.max).toLocaleDateString(
                            "ja-JP",
                          )}
                        </Text>
                      )}
                    </>
                  )}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  プレビュー情報を取得中...
                </Text>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            isDisabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            分析を実行
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAnalysisModal;
