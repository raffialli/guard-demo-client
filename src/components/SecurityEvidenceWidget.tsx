import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { SecurityEvent, Tool } from '../types';

interface SecurityEvidenceWidgetProps {
  compact?: boolean;
}

const SecurityEvidenceWidget: React.FC<SecurityEvidenceWidgetProps> = ({ compact = false }) => {
  const [mcpTools, setMcpTools] = useState<Tool[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [scenarioToolId, setScenarioToolId] = useState<number | null>(null);
  const [scenarioGuardEnabled, setScenarioGuardEnabled] = useState(true);
  const [runningScenario, setRunningScenario] = useState<'' | 'benign' | 'malicious'>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [tools, config, events] = await Promise.all([
        apiService.getTools(),
        apiService.getConfig(),
        apiService.getSecurityEvents(10)
      ]);
      const mcp = tools.filter(t => t.type === 'mcp' && t.enabled);
      setMcpTools(mcp);
      if (!scenarioToolId && mcp.length > 0) setScenarioToolId(mcp[0].id);
      setScenarioGuardEnabled(!!config.lakera_enabled);
      setSecurityEvents(events.events || []);
    } catch (e) {
      console.error('Failed to load security demo data:', e);
    }
  };

  const runScenario = async (scenario: 'benign' | 'malicious') => {
    if (!scenarioToolId) return;
    setRunningScenario(scenario);
    try {
      await apiService.runSecurityScenario(scenarioToolId, scenario, scenarioGuardEnabled);
      const events = await apiService.getSecurityEvents(10);
      setSecurityEvents(events.events || []);
    } catch (e) {
      console.error('Failed running scenario:', e);
    } finally {
      setRunningScenario('');
    }
  };

  const latest = securityEvents[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Live MCP Security Demo</h3>
        <span className="text-xs text-gray-500">Benign vs malicious scenario</span>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-3`}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">MCP server</label>
          <select
            value={scenarioToolId || ''}
            onChange={(e) => setScenarioToolId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {mcpTools.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={scenarioGuardEnabled}
              onChange={(e) => setScenarioGuardEnabled(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
            Guard ON for run
          </label>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => runScenario('benign')}
            disabled={!scenarioToolId || runningScenario !== ''}
            className="px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {runningScenario === 'benign' ? 'Running...' : 'Run Benign'}
          </button>
          <button
            onClick={() => runScenario('malicious')}
            disabled={!scenarioToolId || runningScenario !== ''}
            className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {runningScenario === 'malicious' ? 'Running...' : 'Run Malicious'}
          </button>
        </div>
      </div>

      {latest && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">Latest outcome</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              latest.verdict === 'allow'
                ? 'bg-green-100 text-green-800'
                : latest.verdict === 'block'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {latest.verdict.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{latest.tool_name}</span> · scenario: <span className="font-medium">{latest.scenario}</span> · action: <span className="font-medium">{latest.action}</span>
          </p>
          {latest.marker_matches?.length ? (
            <p className="text-xs text-red-700 mt-2">
              Matched pattern(s): {latest.marker_matches.join(', ')}
            </p>
          ) : null}
          {latest.evidence_excerpt ? (
            <pre className="mt-2 text-xs whitespace-pre-wrap text-red-900 bg-white border border-red-100 p-2 rounded max-h-28 overflow-auto">
              {latest.evidence_excerpt}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SecurityEvidenceWidget;
