// Components
import GithubLogo from './components/GithubLogo';

function Footer() {
  return (
    <footer className="flex flex-none p-[1rem] text-[#fff] bg-[#333]">
      <p className="flex-grow mt-auto mb-auto">Author: Josef Krajkář 2024</p>
      <GithubLogo />
    </footer>
  );
}

export default Footer;
