import { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Minus } from 'lucide-react';
import api from '../services/api'; 
import { AuthContext } from '../context/AuthContext'; 

const ChatWidget = () => {
    const { utilizator } = useContext(AuthContext); 
    const [isOpen, setIsOpen] = useState(false);
    const [mesaj, setMesaj] = useState('');
    const [conversatie, setConversatie] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef(null);

    const sugestiiRapide = [
        "Ce oferte anti-risipă aveți azi? 💰",
        "Vreau ceva cu ciocolată 🍫",
        "Care sunt cele mai ieftine produse? 🍰"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversatie, isLoading]);

    useEffect(() => {
        const nume = utilizator?.nume ? utilizator.nume.split(' ')[0] : '';
        const mesajSalut = nume 
            ? `Salutare, ${nume}! 🍰 Sunt SweetBot, asistentul tău virtual. Cu ce te pot ajuta astăzi?` 
            : `Salut! 🍰 Sunt SweetBot. Cauti o prăjitură anume sau vrei să vezi ofertele noastre?`;
        
        if (conversatie.length === 0) {
            setConversatie([{ sender: 'ai', text: mesajSalut }]);
        }
    }, [utilizator, conversatie.length]);

    const proceseazaMesaj = async (textDeTrimis) => {
        if (!textDeTrimis.trim()) return;

        const mesajUtilizator = { sender: 'user', text: textDeTrimis };
        setConversatie(prev => [...prev, mesajUtilizator]);
        setMesaj('');
        setIsLoading(true);

        try {
            const response = await api.post('/chat', {
                message: mesajUtilizator.text
            });
            setConversatie(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
        } catch (error) {
            console.error('Eroare chat:', error);
            setConversatie(prev => [...prev, { sender: 'ai', text: 'Scuze, am o mică problemă de conexiune. 🔌 Încearcă din nou!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitForm = (e) => {
        e.preventDefault();
        proceseazaMesaj(mesaj);
    };

    return (
        <div style={{ 
            position: 'fixed', 
            bottom: isOpen ? '24px' : '0',
            right: '24px', 
            zIndex: 9999, 
            fontFamily: 'sans-serif', 
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' 
        }}>
            {isOpen ? (
                <div style={{
                    width: '360px', height: '520px',
                    backgroundColor: '#fff', borderRadius: '16px', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', 
                    border: '1px solid #f5eadd'
                }}>
                    {/* Header Chat Elegant */}
                    <div style={{ 
                        backgroundColor: '#c97c2e', color: 'white', padding: '16px 20px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1.05rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                                <Bot size={20} />
                            </div>
                            SweetBot
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            title="Minimizează"
                            style={{ 
                                background: 'none', border: 'none', color: 'white', cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                padding: '4px', borderRadius: '8px', transition: 'background 0.2s'
                            }} 
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} 
                            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <Minus size={22} />
                        </button>
                    </div>

                    {/* Zona de mesaje */}
                    <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fdfaf6' }}>
                        {conversatie.map((msg, index) => (
                            <div key={index} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                display: 'flex', gap: '8px', maxWidth: '85%'
                            }}>
                                {msg.sender === 'ai' && <div style={{ marginTop: '2px', color: '#c97c2e' }}><Bot size={18} /></div>}
                                
                                <div style={{
                                    backgroundColor: msg.sender === 'user' ? '#c97c2e' : '#ffffff',
                                    color: msg.sender === 'user' ? '#ffffff' : '#3d2c1e',
                                    padding: '12px 16px', borderRadius: '18px', 
                                    border: msg.sender === 'ai' ? '1px solid #f5eadd' : 'none',
                                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
                                    borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '18px',
                                    fontSize: '0.95rem', lineHeight: '1.45',
                                    boxShadow: msg.sender === 'ai' ? '0 2px 6px rgba(0,0,0,0.03)' : '0 2px 6px rgba(201, 124, 46, 0.2)'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', color: '#9a7a5a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '26px' }}>
                                <Bot size={14} /> <em>SweetBot tastează...</em>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Butoane Rapide */}
                    {!isLoading && (
                        <div style={{ 
                            padding: '12px 16px', backgroundColor: '#fdfaf6',
                            display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}>
                            {sugestiiRapide.map((sugestie, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => proceseazaMesaj(sugestie)}
                                    style={{
                                        background: '#fff', border: '1px solid #c97c2e', color: '#c97c2e',
                                        padding: '8px 14px', borderRadius: '20px', fontSize: '0.85rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s ease', fontWeight: '500', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#c97c2e'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#c97c2e'; }}
                                >
                                    <Sparkles size={14} /> {sugestie}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Formular Trimitere */}
                    <form onSubmit={handleSubmitForm} style={{ padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #f5eadd', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={mesaj}
                            onChange={(e) => setMesaj(e.target.value)}
                            placeholder="Scrie un mesaj..."
                            disabled={isLoading}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e0e0e0',
                                outline: 'none', fontSize: '0.95rem', backgroundColor: '#fafafa', transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#c97c2e'}
                            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !mesaj.trim()}
                            style={{
                                backgroundColor: '#c97c2e', color: 'white', border: 'none', borderRadius: '50%',
                                width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: isLoading || !mesaj.trim() ? 'not-allowed' : 'pointer', 
                                opacity: isLoading || !mesaj.trim() ? 0.6 : 1, transition: 'transform 0.2s, background-color 0.2s'
                            }}
                            onMouseOver={(e) => { if (!isLoading && mesaj.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Send size={18} style={{ marginLeft: '2px' }} />
                        </button>
                    </form>
                </div>
            ) : (
                /* Tab de Minimizare (Lipește de jos) */
                <div 
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: '#c97c2e', color: 'white', padding: '12px 24px',
                        borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        boxShadow: '0 -2px 15px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '0.95rem',
                        transition: 'background-color 0.2s', width: '220px', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b36a21'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#c97c2e'}
                >
                    <MessageCircle size={20} />
                    Asistență SweetBot
                </div>
            )}
        </div>
    );
};

export default ChatWidget;