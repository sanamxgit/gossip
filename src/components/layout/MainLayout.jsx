import SearchBar from '../search/SearchBar';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-top">
          {/* ... existing header content ... */}
        </div>
        <div className="header-bottom">
          <div className="container">
            <SearchBar />
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="main-footer">
        {/* ... existing footer content ... */}
      </footer>
    </div>
  );
};

export default MainLayout; 