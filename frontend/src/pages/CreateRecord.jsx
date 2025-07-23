import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import problemService from '../services/problemService';
import recordsService from '../services/recordsService';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import MonacoEditor from '@monaco-editor/react';

const { Option } = Select;

const languageOptions = [
  'python', 'java', 'cpp', 'c', 'javascript', 'typescript', 'go', 'rust', 'other'
];
const ojTypeOptions = ['leetcode', 'nowcoder', 'other'];
const executionResultOptions = [
  'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error', 'Other'
];

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

  useEffect(() => {
    if (problemId) {
      // 如果传入 problemId，设置初始值并禁用题目选择
      form.setFieldsValue({ problem_id: problemId });
      setProblemOptions([{ value: problemId, label: `ID: ${problemId}` }]);
    }
  }, [problemId, form]);

  const handleProblemSearch = async (value) => {
    setFetching(true);
    try {
      const data = await problemService.getProblems({ title: value, limit: 20 });
      setProblemOptions(
        data.map((p) => ({
          value: p.id,
          label: `${p.title} (${p.difficulty || ''})`,
        }))
      );
    } catch (e) {
      setProblemOptions([]);
    } finally {
      setFetching(false);
    }
  };

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
          >
            <Select
              showSearch
              placeholder={t('records.problemTitlePlaceholder')}
              filterOption={false}
              onSearch={handleProblemSearch}
              options={problemOptions}
              notFoundContent={fetching ? <Spin size="small" /> : null}
              disabled={!!problemId}
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
                <Option key={oj} value={oj}>{oj}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="execution_result"
            label={t('records.status')}
            rules={[{ required: true, message: t('records.statusRequired') }]}
          >
            <Select>
              {executionResultOptions.map((r) => (
                <Option key={r} value={r}>{r}</Option>
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
                <span style={{ marginRight: 6, color: '#aaa', fontSize: 13 }}>{t('records.codeCompletion') || '补全'}</span>
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
            <Input placeholder={t('records.runtime')} />
          </Form.Item>
          <Form.Item name="memory" label={t('records.memory')}>
            <Input placeholder={t('records.memory')} />
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
            <Select mode="tags" placeholder={t('records.topicTags')} />
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
