/**
 * 观锦阁 - 登录状态管理
 */
const Auth = {
  getToken() { return localStorage.getItem('token'); },
  setToken(t) { localStorage.setItem('token', t); },
  removeToken() { localStorage.removeItem('token'); },
  getUser() {
    const u = localStorage.getItem('userInfo');
    return u ? JSON.parse(u) : null;
  },
  setUser(u) { localStorage.setItem('userInfo', JSON.stringify(u)); },
  removeUser() { localStorage.removeItem('userInfo'); },
  isLoggedIn() { return !!this.getToken(); },
  logout() { this.removeToken(); this.removeUser(); }
};
