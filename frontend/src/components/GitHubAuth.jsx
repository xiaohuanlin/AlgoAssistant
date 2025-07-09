import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GitHubAuth = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [repo, setRepo] = useState('');
    const [showRepoInput, setShowRepoInput] = useState(false);

    useEffect(() => {
        checkGitHubStatus();
    }, []);

    const checkGitHubStatus = async () => {
        try {
            const response = await axios.get('/api/github/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setStatus(response.data);
        } catch (error) {
            console.error('Error checking GitHub status:', error);
            setStatus({ connected: false, message: 'Error checking status' });
        } finally {
            setLoading(false);
        }
    };

    const connectGitHub = async () => {
        setConnecting(true);
        try {
            const response = await axios.get('/api/github/auth', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Open GitHub OAuth in new window
            const authWindow = window.open(
                response.data.auth_url,
                'github-auth',
                'width=600,height=700,scrollbars=yes,resizable=yes'
            );

            // Poll for window close
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    setConnecting(false);
                    checkGitHubStatus(); // Refresh status
                }
            }, 1000);

        } catch (error) {
            console.error('Error starting GitHub auth:', error);
            setConnecting(false);
        }
    };

    const disconnectGitHub = async () => {
        try {
            await axios.delete('/api/github/disconnect', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            checkGitHubStatus();
        } catch (error) {
            console.error('Error disconnecting GitHub:', error);
        }
    };

    const updateRepo = async () => {
        try {
            await axios.put('/api/github/repo', 
                { repo },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setShowRepoInput(false);
            checkGitHubStatus();
        } catch (error) {
            console.error('Error updating repo:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <svg className="w-8 h-8 text-gray-800 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-800">GitHub 集成</h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status?.connected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {status?.connected ? '已连接' : '未连接'}
                </div>
            </div>

            {status?.connected ? (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-800 font-medium">GitHub 已成功连接</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                GitHub 用户名
                            </label>
                            <div className="text-gray-900 font-mono">{status.username}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                代码仓库
                            </label>
                            {showRepoInput ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={repo}
                                        onChange={(e) => setRepo(e.target.value)}
                                        placeholder="username/repo-name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={updateRepo}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                        >
                                            保存
                                        </button>
                                        <button
                                            onClick={() => setShowRepoInput(false)}
                                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="text-gray-900 font-mono">{status.repo}</div>
                                    <button
                                        onClick={() => {
                                            setRepo(status.repo);
                                            setShowRepoInput(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        编辑
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={disconnectGitHub}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            断开连接
                        </button>
                        <button
                            onClick={checkGitHubStatus}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            刷新状态
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-yellow-800">GitHub 未连接</span>
                        </div>
                    </div>

                    <p className="text-gray-600">
                        连接 GitHub 后，您的刷题代码将自动同步到 GitHub 仓库。
                        我们使用 OAuth 授权，无需手动输入任何信息。
                    </p>

                    <button
                        onClick={connectGitHub}
                        disabled={connecting}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                            connecting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                    >
                        {connecting ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                正在连接...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                连接 GitHub
                            </div>
                        )}
                    </button>

                    <div className="text-xs text-gray-500 text-center">
                        点击按钮将打开 GitHub 授权页面，授权后自动完成连接
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitHubAuth; 