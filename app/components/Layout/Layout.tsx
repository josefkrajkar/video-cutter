// Components
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100vh]">
      <Header />
      <main className="grow flex p-1 align-middle justify-center">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
