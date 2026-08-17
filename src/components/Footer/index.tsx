const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container text-center">
        <p className="mb-0">&copy; {new Date().getFullYear()} Caramelo Cerâmicas. Todos os direitos reservados.</p>
        <small className="text-muted">Produzido de forma artesanal com muito amor.</small>
      </div>
    </footer>
  );
};

export default Footer;
