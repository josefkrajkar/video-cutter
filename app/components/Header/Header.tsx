// Components
import CamLogo from './components/CamLogo';

function Header() {
  return (
    <header className="flex p-[1rem] bg-[#333] text-[#fff]">
      <div className="relative flex">
        <CamLogo />
        <h1 className="text-[1.5rem] mt-auto mb-auto">Cutting room</h1>
        <a href="/" className="absolute inset-0" aria-label="Home" />
      </div>
    </header>
  );
}

export default Header;
