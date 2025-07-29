import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import MonacoEditor from '@monaco-editor/react';
import StatusIndicator from '../components/common/StatusIndicator';

const { Option } = Select;

const languageOptions = [
  'python', 'java', 'cpp', 'c', 'javascript', 'typescript', 'go', 'rust', 'other'
];
const ojTypeOptions = ['leetcode', 'other'];
const executionResultOptions = [
  'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error', 'Other'
]; // Keep values as-is for API compatibility, StatusIndicator will handle translation

const CreateRecord = ({ problemId, onSuccess }) => {
  const [form] = Form.useForm();
  const [problemOptions, setProblemOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [codeValue, setCodeValue] = useState('');
  const [languageValue, setLanguageValue] = useState('python');
  const [completionEnabled, setCompletionEnabled] = useState(false);
  const [topicTagOptions, setTopicTagOptions] = useState([]);

  // Common topic tags
  const commonTags = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
    'Two Pointers', 'Greedy', 'Sorting', 'Binary Search', 'Tree',
    'Depth-First Search', 'Breadth-First Search', 'Graph', 'Stack', 'Queue',
    'Linked List', 'Binary Tree', 'Recursion', 'Backtracking', 'Sliding Window'
  ];

  const handleProblemSearch = async (value) => {
    setFetching(true);
    try {
      let searchResults = [];

      if (value) {
        // Check if input is a number (ID search)
        const isNumeric = /^\d+$/.test(value.trim());

        if (isNumeric) {
          // Search by ID
          try {
            const problemId = parseInt(value.trim());
            const singleProblem = await problemService.getProblem(problemId);
            if (singleProblem) {
              searchResults = [singleProblem];
            }
          } catch (error) {
            // If ID search fails, fall back to title search
            const response = await problemService.getProblems({
              title: value,
              limit: 50,
              sort_by: 'created_at',
              sort_order: 'desc'
            });
            searchResults = Array.isArray(response) ? response : response.items || [];
          }
        } else {
          // Search by title
          const response = await problemService.getProblems({
            title: value,
            limit: 50,
            sort_by: 'created_at',
            sort_order: 'desc'
          });
          searchResults = Array.isArray(response) ? response : response.items || [];
        }
      } else {
        // Load problems with records (user's problems) when no search value
        const response = await problemService.getProblems({
          limit: 50,
          records_only: true,
          sort_by: 'created_at',
          sort_order: 'desc'
        });
        searchResults = Array.isArray(response) ? response : response.items || [];

        // If no problems found with records_only, try again without the filter
        if (searchResults.length === 0) {
          const fallbackResponse = await problemService.getProblems({
            limit: 50,
            sort_by: 'created_at',
            sort_order: 'desc'
          });
          searchResults = Array.isArray(fallbackResponse) ? fallbackResponse : fallbackResponse.items || [];
        }
      }

      setProblemOptions(
        searchResults.map((p) => ({
          value: p.id,
          label: `#${p.id} ${p.title}${p.difficulty ? ` (${p.difficulty})` : ''}${p.source ? ` [${p.source}]` : ''}`,
        }))
      );
    } catch (e) {
      message.error(t('records.loadProblemsError') || 'Failed to load problems');
      setProblemOptions([]);
    } finally {
      setFetching(false);
    }
  };

  // Load topic tags from database
  const loadTopicTags = async () => {
    try {
      const response = await recordsService.getTags();
      const dbTags = response.map(tag => tag.name);

      // Combine common tags with database tags, remove duplicates
      const allTags = [...new Set([...commonTags, ...dbTags])];
      const tagOptions = allTags.map(tag => ({ label: tag, value: tag }));

      setTopicTagOptions(tagOptions);
    } catch (error) {
      // If failed to load from database, just use common tags
      const tagOptions = commonTags.map(tag => ({ label: tag, value: tag }));
      setTopicTagOptions(tagOptions);
    }
  };

  useEffect(() => {
    if (problemId) {
      // If problemId is passed, set initial value and disable problem selection
      form.setFieldsValue({ problem_id: problemId });
      setProblemOptions([{ value: problemId, label: `ID: ${problemId}` }]);
    } else {
      // Load initial problems when component mounts
      handleProblemSearch('');
    }

    // Load topic tags
    loadTopicTags();
  }, [problemId, form]);

  const getMonacoLang = (language) => {
    if (!language) return 'plaintext';
    const lower = language.toLowerCase();
    if (lower.includes('python')) return 'python';
    if (lower.includes('java') && !lower.includes('javascript')) return 'java';
    if (lower.includes('cpp') || lower.includes('c++')) return 'cpp';
    if (lower.includes('c') && !lower.includes('cpp')) return 'c';
    if (lower.includes('go')) return 'go';
    if (lower.includes('rust')) return 'rust';
    if (lower.includes('javascript')) return 'javascript';
    return 'plaintext';
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        code: codeValue,
        submit_time: values.submit_time ? values.submit_time.toISOString() : undefined,
      };
      await recordsService.createRecord(payload);
      message.success(t('records.createSuccess'));
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/records');
      }
    } catch (e) {
      message.error(e.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .cm-editor .cm-scroller {
          align-items: flex-start !important;
        }
      `}</style>
      <Spin spinning={submitting}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          style={{ maxWidth: 600, margin: '0 auto', marginTop: 32 }}
          initialValues={problemId ? { problem_id: problemId } : {}}
        >
          <Form.Item
            name="problem_id"
            label={t('records.problem')}
            rules={[{ required: true, message: t('records.problemIdRequired') }]}
            extra={t('records.problemSelectionHint') || 'Select from your problems or search by title'}
          >
            <Select
              showSearch
              allowClear
              placeholder={t('records.problemSearchPlaceholder') || 'Search by problem title or enter problem ID'}
              filterOption={false}
              onSearch={handleProblemSearch}
              options={problemOptions}
              notFoundContent={fetching ? <Spin size="small" /> : (problemOptions.length === 0 ? t('records.noProblemsFound') || 'No problems found. Try searching by title or ID.' : null)}
              disabled={!!problemId}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {!fetching && problemOptions.length === 0 && (
                    <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0', color: '#666', fontSize: '12px' }}>
                      💡 {t('records.problemSearchHint') || 'You can search by problem title or enter a problem ID directly (e.g., "1", "two sum")'}
                    </div>
                  )}
                </>
              )}
            />
          </Form.Item>
          <Form.Item
            name="oj_type"
            label={t('records.ojType')}
            rules={[{ required: true, message: t('records.selectOjType') }]}
            initialValue="leetcode"
          >
            <Select>
              {ojTypeOptions.map((oj) => (
                <Option key={oj} value={oj}>
                  {oj === 'leetcode' ? 'LeetCode' : t('common.custom')}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="execution_result"
            label={t('records.submitStatus')}
            rules={[{ required: true, message: t('records.statusRequired') }]}
          >
            <Select>
              {executionResultOptions.map((r) => (
                <Option key={r} value={r}>
                  <StatusIndicator
                    status={r}
                    type="execution"
                    showText={true}
                  />
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="language"
            label={t('records.language')}
            rules={[{ required: true, message: t('records.languageRequired') }]}
          >
            <Select
              showSearch
              placeholder={t('records.languagePlaceholder')}
              value={languageValue}
              onChange={v => setLanguageValue(v)}
            >
              {languageOptions.map((lang) => (
                <Option key={lang} value={lang}>{lang}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="code" label={t('records.code')}>
            <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', marginBottom: 8, minHeight: 320, width: '100%' }}>
              <div style={{ position: 'absolute', top: 8, right: 12, zIndex: 2, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 6, color: '#aaa', fontSize: 13 }}>{t('records.codeCompletion') || 'Completion'}</span>
                <Switch size="small" checked={completionEnabled} onChange={setCompletionEnabled} />
              </div>
              <MonacoEditor
                height="320px"
                defaultLanguage={getMonacoLang(languageValue)}
                language={getMonacoLang(languageValue)}
                value={codeValue}
                onChange={v => setCodeValue(v || '')}
                theme="vs-dark"
                options={{
                  fontSize: 16,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                  overviewRulerLanes: 0,
                  renderLineHighlight: 'line',
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  contextmenu: true,
                  folding: true,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  renderIndentGuides: true,
                  renderValidationDecorations: 'on',
                  tabSize: 4,
                  insertSpaces: true,
                  automaticLayout: true,
                  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
                  selectionHighlight: true,
                  selectionClipboard: true,
                  smoothScrolling: true,
                  cursorBlinking: 'blink',
                  cursorSmoothCaretAnimation: true,
                  bracketPairColorization: { enabled: true },
                  matchBrackets: 'always',
                  fixedOverflowWidgets: true,
                  quickSuggestions: completionEnabled,
                  suggestOnTriggerCharacters: completionEnabled,
                  acceptSuggestionOnEnter: completionEnabled ? 'on' : 'off',
                  formatOnPaste: false,
                  formatOnType: false,
                  codeLens: false,
                  links: true,
                  mouseWheelZoom: true,
                  hideCursorInOverviewRuler: true,
                  highlightActiveIndentGuide: true,
                  renderWhitespace: 'boundary',
                  renderControlCharacters: false,
                  renderLineHighlightOnlyWhenFocus: false,
                  useTabStops: true,
                  ariaLabel: t('records.code'),
                }}
              />
            </div>
          </Form.Item>
          <Form.Item
            name="submit_time"
            label={t('records.submitTime')}
            rules={[{ required: true, message: t('records.submitTimePlaceholder') }]}
            initialValue={dayjs()}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="runtime" label={t('records.runtime')}>
            <Input placeholder={t('records.runtimePlaceholder', 'e.g., 100ms')} />
          </Form.Item>
          <Form.Item name="memory" label={t('records.memory')}>
            <Input placeholder={t('records.memoryPlaceholder', 'e.g., 50MB')} />
          </Form.Item>
          <Form.Item name="runtime_percentile" label={t('records.runtimePercentile')}>
            <Input type="number" min={0} max={100} step={0.01} placeholder={t('records.runtimePercentile')} />
          </Form.Item>
          <Form.Item name="memory_percentile" label={t('records.memoryPercentile')}>
            <Input type="number" min={0} max={100} step={0.01} placeholder={t('records.memoryPercentile')} />
          </Form.Item>
          <Form.Item name="total_correct" label={t('records.totalCorrect')}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="total_testcases" label={t('records.totalTestcases')}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="topic_tags" label={t('records.topicTags')}>
            <Select
              mode="tags"
              placeholder={t('records.topicTagsPlaceholder', 'Select or add topic tags')}
              options={topicTagOptions}
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              {t('common.create')}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </>
  );
};

export default CreateRecord;
