import React, { useState, useEffect } from 'react';
import { Plus, Settings, Play, Trash2, Search, ShieldCheck, ShieldAlert, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { Tool, ToolCreate, AppConfig } from '../types';
import { apiService } from '../services/api';

const ToolManager: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [testResults, setTestResults] = useState<Record<number, any>>({});
  const [testingTools, setTestingTools] = useState<Record<number, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const [showRawResult, setShowRawResult] = useState<Record<number, boolean>>({});
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  const [newTool, setNewTool] = useState<ToolCreate>({
    name: '',
    description: '',
    endpoint: '',
    type: 'mcp',
    enabled: true,
    config_json: {},
  });

  useEffect(() => {
    loadTools();
    loadConfig();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const toolsData = await apiService.getTools();
      setTools(toolsData);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const config = await apiService.getConfig();
      setAppConfig(config);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleAddTool = async () => {
    try {
      await apiService.createTool(newTool);
      setNewTool({
        name: '',
        description: '',
        endpoint: '',
        type: 'mcp',
        enabled: true,
        config_json: {},
      });
      setShowAddForm(false);
      await loadTools();
    } catch (error) {
      console.error('Failed to add tool:', error);
    }
  };

  const handleUpdateTool = async (tool: Tool) => {
    try {
      await apiService.updateTool(tool.id, {
        name: tool.name,
        description: tool.description,
        endpoint: tool.endpoint,
        type: tool.type,
        enabled: tool.enabled,
        config_json: tool.config_json,
      });
      setEditingTool(null);
      await loadTools();
    } catch (error) {
      console.error('Failed to update tool:', error);
    }
  };

  const handleDeleteTool = async (toolId: number) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      await apiService.deleteTool(toolId);
      await loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const handleTestTool = async (toolId: number) => {
    setTestingTools(prev => ({ ...prev, [toolId]: true }));
    try {
      const result = await apiService.testTool(toolId, { test: true });
      setTestResults(prev => ({ ...prev, [toolId]: result }));
      await loadTools();
    } catch (error) {
      console.error('Failed to test tool:', error);
      setTestResults(prev => ({ ...prev, [toolId]: { error: 'Test failed' } }));
    } finally {
      setTestingTools(prev => ({ ...prev, [toolId]: false }));
    }
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mcpTools = filteredTools.filter(t => t.type === 'mcp');

  const getDiscoveredTools = (tool: Tool): any[] => {
    const stored = tool.mcp_capabilities?.discovery_results?.tools_list_params_0?.response?.result?.tools;
    if (Array.isArray(stored)) return stored;

    const latest = testResults[tool.id]?.discovery?.discovery_results?.tools_list_params_0?.response?.result?.tools;
    if (Array.isArray(latest)) return latest;

    return [];
  };

  const getDiscoveredToolCount = (tool: Tool): number => {
    return getDiscoveredTools(tool).length;
  };

  const getEndpointStatus = (tool: Tool): 'healthy' | 'unknown' | 'error' => {
    const latest = testResults[tool.id];
    if (latest?.status === 'success') return 'healthy';
    if (latest?.status === 'error' || latest?.error) return 'error';
    if (tool.mcp_capabilities?.last_discovered) return 'healthy';
    return 'unknown';
  };

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tool</span>
        </button>
      </div>

      {/* MCP Health + Security Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">MCP Endpoints</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{mcpTools.length}</p>
          <p className="text-xs text-gray-500 mt-1">Configured MCP tools</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lakera Guard</span>
            {appConfig?.lakera_enabled ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {appConfig?.lakera_enabled ? 'ON' : 'OFF'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {appConfig?.lakera_enabled
              ? `Mode: ${appConfig.lakera_blocking_mode ? 'Blocking' : 'Monitoring'}`
              : 'Tool output screening disabled'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Discoverable MCP Tools</span>
            <Play className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {mcpTools.reduce((sum, tool) => sum + getDiscoveredToolCount(tool), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">From latest capability discovery</p>
        </div>
      </div>

      {/* Discovered tools by MCP server (demo-friendly list) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Discovered MCP Tools by Server</h3>
          <span className="text-xs text-gray-500">Use Play to refresh discovery</span>
        </div>

        {mcpTools.length === 0 ? (
          <p className="text-sm text-gray-600">No MCP servers configured yet.</p>
        ) : (
          <div className="space-y-3">
            {mcpTools.map((tool) => {
              const discovered = getDiscoveredTools(tool);
              const isOpen = !!expandedTools[tool.id];
              return (
                <div key={`summary-${tool.id}`} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedTools(prev => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                      <p className="text-xs text-gray-600">{discovered.length} tools discovered</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      {discovered.length === 0 ? (
                        <p className="text-xs text-gray-600 mt-2">No tools yet. Click Play on this MCP server.</p>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {discovered.map((t: any, idx: number) => (
                            <li key={`${tool.id}-summary-tool-${idx}`} className="text-sm text-gray-800 flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <div>
                                <span className="font-medium">{t.name || `tool_${idx + 1}`}</span>
                                {t.description && (
                                  <span className="text-gray-600"> — {t.description}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Tool Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tool</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newTool.type}
                onChange={(e) => setNewTool({ ...newTool, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="mcp">MCP (SSE Endpoint)</option>
                <option value="http">HTTP (MCP Endpoint)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
              <input
                type="text"
                value={newTool.endpoint}
                onChange={(e) => setNewTool({ ...newTool, endpoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTool}
              disabled={!newTool.name}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Add Tool
            </button>
          </div>
        </div>
      )}

      {/* Tools List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tools...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{tool.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tool.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tool.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {tool.type.toUpperCase()}
                    </span>
                  </div>
                  {tool.description && (
                    <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                  )}
                  {tool.endpoint && (
                    <p className="text-xs text-gray-500 mt-1">{tool.endpoint}</p>
                  )}

                  {tool.type === 'mcp' && (
                    <div className="mt-2 space-y-1 text-xs">
                      <p>
                        <span className="text-gray-500">Endpoint status:</span>{' '}
                        <span className={
                          getEndpointStatus(tool) === 'healthy' ? 'text-green-700' :
                          getEndpointStatus(tool) === 'error' ? 'text-red-700' : 'text-gray-600'
                        }>
                          {getEndpointStatus(tool) === 'healthy' ? 'Alive' :
                           getEndpointStatus(tool) === 'error' ? 'Error' : 'Unknown'}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Discovered tools:</span> {getDiscoveredToolCount(tool)}
                      </p>
                      <p>
                        <span className="text-gray-500">Last discovery:</span>{' '}
                        {tool.mcp_capabilities?.last_discovered
                          ? new Date(tool.mcp_capabilities.last_discovered).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestTool(tool.id)}
                    disabled={!!testingTools[tool.id]}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title={tool.type === 'mcp' ? 'Re-discover capabilities' : 'Test Tool'}
                  >
                    <Play className={`w-4 h-4 ${testingTools[tool.id] ? 'animate-pulse' : ''}`} />
                  </button>
                  {tool.type === 'mcp' && (
                    <button
                      onClick={() => setExpandedTools(prev => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                      className="px-2 py-1 text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200"
                      title="Show discovered tools"
                    >
                      <span className="inline-flex items-center gap-1">
                        Show tools
                        {expandedTools[tool.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setEditingTool(editingTool?.id === tool.id ? null : tool)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit Tool"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete Tool"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingTool?.id === tool.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editingTool.name}
                        onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={editingTool.type}
                        onChange={(e) => setEditingTool({ ...editingTool, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="mcp">MCP (SSE Endpoint)</option>
                        <option value="http">HTTP (MCP Endpoint)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editingTool.description || ''}
                        onChange={(e) => setEditingTool({ ...editingTool, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                      <input
                        type="text"
                        value={editingTool.endpoint || ''}
                        onChange={(e) => setEditingTool({ ...editingTool, endpoint: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`enabled-${tool.id}`}
                        checked={editingTool.enabled}
                        onChange={(e) => setEditingTool({ ...editingTool, enabled: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`enabled-${tool.id}`} className="text-sm font-medium text-gray-700">
                        Enabled
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => setEditingTool(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateTool(editingTool)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Discovered Tools (human-friendly view) */}
              {tool.type === 'mcp' && expandedTools[tool.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Discovered tools ({getDiscoveredToolCount(tool)})
                  </h4>
                  {getDiscoveredToolCount(tool) === 0 ? (
                    <p className="text-xs text-gray-600">No tools discovered yet. Click Play to run discovery.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {getDiscoveredTools(tool).map((t: any, idx: number) => (
                        <div key={`${tool.id}-${idx}`} className="p-2 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-sm font-medium text-gray-900">{t.name || `tool_${idx + 1}`}</p>
                          {t.description && <p className="text-xs text-gray-600 mt-1">{t.description}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Params: {Object.keys(t.inputSchema?.properties || {}).length}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Raw Test Result (debug) */}
              {testResults[tool.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowRawResult(prev => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                    className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    {showRawResult[tool.id] ? 'Hide debug JSON' : 'Show debug JSON'}
                    {showRawResult[tool.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showRawResult[tool.id] && (
                    <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(testResults[tool.id], null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredTools.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tools found</p>
        </div>
      )}
    </div>
  );
};

export default ToolManager;

