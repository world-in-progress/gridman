import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import './ChatPanel.css';

interface Message {
    text: string;
    sender: 'user' | 'ai';
    isStreaming?: boolean;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 组件卸载时中断任何进行中的请求
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const scrollToBottom = (): void => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (): Promise<void> => {
        if (input.trim() === '') return;
        
        // 添加用户消息
        const userMessage: Message = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        
        // 创建AI消息占位符，用于流式更新
        const aiMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, { 
            text: '', 
            sender: 'ai',
            isStreaming: true
        }]);
        
        setInput('');
        setIsLoading(true);
        
        // 创建新的 AbortController 用于取消请求
        abortControllerRef.current = new AbortController();
        
        try {
            const response = await fetch('http://localhost:8000/clever-grid/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: input }),
                signal: abortControllerRef.current.signal
            });
            
            if (!response.body) {
                throw new Error('ReadableStream not supported');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let responseText = '';
            
            // 读取流数据
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                responseText += chunk;
                
                // 更新消息内容
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    if (newMessages[aiMessageIndex]) {
                        newMessages[aiMessageIndex] = {
                            ...newMessages[aiMessageIndex],
                            text: responseText
                        };
                    }
                    return newMessages;
                });
            }
            
            // 将消息标记为完成流式传输
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                if (newMessages[aiMessageIndex]) {
                    newMessages[aiMessageIndex] = {
                        ...newMessages[aiMessageIndex],
                        isStreaming: false
                    };
                }
                return newMessages;
            });
            
        } catch (error) {
            // 只有在不是用户主动取消的情况下才显示错误
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Error fetching response from LLM:', error);
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[aiMessageIndex]) {
                        newMessages[aiMessageIndex] = { 
                            text: 'Sorry, I encountered an error. Please try again later.', 
                            sender: 'ai',
                            isStreaming: false
                        };
                    }
                    return newMessages;
                });
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCancel = (): void => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            
            // 更新最后一条消息，标记为非流式
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        isStreaming: false,
                        text: lastMessage.text || '(Response cancelled)'
                    };
                }
                return newMessages;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3>AI Assistant</h3>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="messages-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender} ${msg.isStreaming ? 'streaming' : ''}`}>
                        {msg.text || (msg.isStreaming && !msg.text ? '...' : '')}
                        {msg.isStreaming && (
                            <div className="typing-indicator inline">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
                <textarea 
                    value={input} 
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                />
                {isLoading ? (
                    <button className="cancel-button" onClick={handleCancel}>
                        Cancel
                    </button>
                ) : (
                    <button onClick={handleSend} disabled={input.trim() === ''}>
                        Send
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;