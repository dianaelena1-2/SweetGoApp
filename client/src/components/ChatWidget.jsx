import { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';
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
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'sans-serif' }}>
            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: '70px', right: '0', width: '350px', height: '520px',
                    backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eaeaea'
                }}>
                    {/* Header Chat */}
                    <div style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <Bot size={24} />
                            SweetBot
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Zona de mesaje */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fafafa' }}>
                        {conversatie.map((msg, index) => (
                            <div key={index} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                display: 'flex', gap: '8px', maxWidth: '85%'
                            }}>
                                {msg.sender === 'ai' && <div style={{ marginTop: '4px', color: '#f43f5e' }}><Bot size={18} /></div>}
                                
                                <div style={{
                                    backgroundColor: msg.sender === 'user' ? '#f43f5e' : '#ffffff',
                                    color: msg.sender === 'user' ? '#ffffff' : '#333333',
                                    padding: '10px 14px', borderRadius: '16px', border: msg.sender === 'ai' ? '1px solid #eaeaea' : 'none',
                                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                    borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                                    fontSize: '14px', lineHeight: '1.4'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', color: '#888', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Bot size={14} /> SweetBot scrie...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Butoane Rapide */}
                    {!isLoading && (
                        <div style={{ 
                            padding: '8px 12px', backgroundColor: '#fafafa', borderTop: '1px solid #eaeaea',
                            display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}>
                            {sugestiiRapide.map((sugestie, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => proceseazaMesaj(sugestie)}
                                    style={{
                                        background: '#fff', border: '1px solid #f43f5e', color: '#f43f5e',
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#f43f5e'; }}
                                >
                                    <Sparkles size={12} /> {sugestie}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Formular Trimitere */}
                    <form onSubmit={handleSubmitForm} style={{ padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #eaeaea', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={mesaj}
                            onChange={(e) => setMesaj(e.target.value)}
                            placeholder="Întreabă ceva..."
                            disabled={isLoading}
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #ccc',
                                outline: 'none', fontSize: '14px'
                            }}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !mesaj.trim()}
                            style={{
                                backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '50%',
                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: isLoading || !mesaj.trim() ? 'not-allowed' : 'pointer', opacity: isLoading || !mesaj.trim() ? 0.6 : 1
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Butonul Plutitor */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '50%',
                    width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)', transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

export default ChatWidget;