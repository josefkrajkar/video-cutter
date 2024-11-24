function GithubLogo() {
  return (
    <div className="bg-[#fff] rounded-full p-[0.5rem] w-[34px] h-[34px] bg-[url('/github.png')] bg-cover bg-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3), 0_4px_6px_-1px_rgba(0, 0, 0, 0.4), 0_2px_4px_-1px_rgba(0, 0, 0, 0.2)]">
      <a
        href="https://github.com/josefkrajkar"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className="absolute inset-0"
      />
    </div>
  );
}

export default GithubLogo;
