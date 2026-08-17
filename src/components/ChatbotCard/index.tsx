import { useState } from 'react';
import './ChatbotCard.css';

const ChatbotCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <button 
          className="btn btn-warning rounded-circle shadow-lg chatbot-toggle"
          onClick={() => setIsOpen(true)}
        >
          <i className="bi bi-chat-dots-fill fs-3 text-dark"></i>
        </button>
      )}

      {isOpen && (
        <div className="card shadow-lg chatbot-card border-warning">
          <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Caramelo Bot</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setIsOpen(false)}
            ></button>
          </div>
          <div className="card-body chatbot-body bg-light overflow-auto">
            <div className="d-flex flex-column gap-3">
              <div className="bot-message bg-white p-2 rounded-3 shadow-sm align-self-start border">
                Olá! Sou o assistente da Caramelo Cerâmicas. Gostaria de recomendações de peças para o seu estilo?
              </div>
            </div>
          </div>
          <div className="card-footer bg-white">
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Digite sua mensagem..." />
              <button className="btn btn-warning" type="button">
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotCard;
