import { Link } from 'react-router-dom';

export default function RouterBar() {
  return (
    <nav className="app-nav">
      <Link to="/">首页</Link>
      <Link to="/content">内容页</Link>
    </nav>
  );
}
