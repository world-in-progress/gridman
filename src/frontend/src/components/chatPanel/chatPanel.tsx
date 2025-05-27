import React, {
    useState,
    useRef,
    useEffect,
    KeyboardEvent,
    ChangeEvent,
    useContext,
} from 'react';
import { Bot, X } from 'lucide-react';
import { LanguageContext } from '../../context';

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
    const { language } = useContext(LanguageContext);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        const userMessage: Message = { text: input, sender: 'user' };
        setMessages((prev) => [...prev, userMessage]);

        const aiMessageIndex = messages.length + 1;
        setMessages((prev) => [
            ...prev,
            {
                text: '',
                sender: 'ai',
                isStreaming: true,
            },
        ]);

        setInput('');
        setIsLoading(true);

        abortControllerRef.current = new AbortController();

        try {
            // TODO: refactor this to use a more robust API interface
            const response = await fetch(
                '/api/bot/chat/stream',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: input }),
                    signal: abortControllerRef.current.signal,
                }
            );

            if (!response.body) {
                throw new Error('ReadableStream not supported');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let responseText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                responseText += chunk;

                setMessages((prevMessages) => {
                    const newMessages = [...prevMessages];
                    if (newMessages[aiMessageIndex]) {
                        newMessages[aiMessageIndex] = {
                            ...newMessages[aiMessageIndex],
                            text: responseText,
                        };
                    }
                    return newMessages;
                });
            }

            setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                if (newMessages[aiMessageIndex]) {
                    newMessages[aiMessageIndex] = {
                        ...newMessages[aiMessageIndex],
                        isStreaming: false,
                    };
                }
                return newMessages;
            });
        } catch (error) {
            if (
                !(error instanceof DOMException && error.name === 'AbortError')
            ) {
                console.error('Error fetching response from LLM:', error);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    if (newMessages[aiMessageIndex]) {
                        newMessages[aiMessageIndex] = {
                            text:
                                language === 'zh'
                                    ? '抱歉，我遇到了错误。请稍后再试。'
                                    : 'Sorry, I encountered an error. Please try again later.',
                            sender: 'ai',
                            isStreaming: false,
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

            setMessages((prevMessages) => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        isStreaming: false,
                        text:
                            lastMessage.text ||
                            (language === 'zh'
                                ? '(响应已取消)'
                                : '(Response cancelled)'),
                    };
                }
                return newMessages;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-[144px] bottom-0 w-[350px] bg-white shadow-md flex flex-col z-[10] border-l border-gray-600">
            <div className="p-4 h-16 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                <h3 className="flex items-center">
                    <Bot className="w-8 h-8 mr-2" />
                    <span className="text-md text-gray-700 font-bold">
                        {language === 'zh' ? 'AI助手' : 'AI Assistant'}
                    </span>
                </h3>
                <button
                    className="bg-transparent border-none text-2xl cursor-pointer text-gray-500"
                    onClick={onClose}
                    aria-label={language === 'zh' ? '关闭对话' : 'Close chat'}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-[15px] flex flex-col gap-[10px]">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`p-[10px_15px] rounded-[18px] max-w-[80%] break-words ${
                            msg.sender === 'user'
                                ? 'self-end bg-blue-500 text-white'
                                : 'self-start bg-gray-100 text-gray-800'
                        } ${msg.isStreaming ? 'animate-pulse' : ''}`}
                    >
                        {msg.text ||
                            (msg.isStreaming && !msg.text ? '...' : '')}
                        {msg.isStreaming && (
                            <div className="inline-flex ml-[5px] align-middle items-center justify-center gap-[5px]">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.2s_infinite_ease-in-out]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.2s_infinite_ease-in-out_0.2s]"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-[bounce_1.2s_infinite_ease-in-out_0.4s]"></span>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-[15px] border-t border-gray-200 flex gap-[10px]">
                <textarea
                    value={input}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setInput(e.target.value)
                    }
                    onKeyPress={handleKeyPress}
                    placeholder={
                        language === 'zh'
                            ? '请输入问题...'
                            : 'Ask me anything...'
                    }
                    disabled={isLoading}
                    className="flex-grow p-[10px] border border-gray-300 rounded resize-none h-[60px]"
                />
                {isLoading ? (
                    <button
                        className="px-[15px] bg-red-500 hover:bg-red-700 text-white border-none rounded cursor-pointer"
                        onClick={handleCancel}
                    >
                        {language === 'zh' ? '取消' : 'Cancel'}
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={input.trim() === ''}
                        className="px-[15px] bg-blue-500 text-white border-none rounded cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {language === 'zh' ? '发送' : 'Send'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
