import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AlertModal from '../../../components/AlertModal';
import '../styles/LoginPage.css';

function LoginPage() {
  const { login, register, loading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        const response = await login({
          email: formData.email,
          password: formData.password,
        });
        
        if (response && response.name) {
          localStorage.setItem('userName', response.name);
          console.log('✅ User name saved to localStorage after login:', response.name);
        }
        
        setTimeout(() => {
          const token = localStorage.getItem('accessToken');
          console.log('🔍 Checking token after login...');
          console.log('   Token exists?', !!token);
          console.log('   Token value:', token ? token.substring(0, 50) + '...' : 'null');
          
          if (token) {
            console.log('✅ Login successful, token saved');
            window.location.href = '/';
          } else {
            console.error('❌ Token not found after login');
            console.log('💡 API 클라이언트의 콘솔 로그를 확인하세요.');
            console.log('   - Authorization 헤더를 읽었는지 확인');
            console.log('   - 토큰이 저장되었는지 확인');
            
            const message = '로그인은 성공했지만 토큰을 저장하지 못했습니다.\n\n' +
              '브라우저 콘솔(F12)을 확인하여 자세한 정보를 확인하세요.\n\n' +
              '다시 시도해주세요.';
            setAlertModal({ isOpen: true, message: message, type: 'error' });
          }
        }, 500);
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
        });

        localStorage.setItem('userName', formData.name);

        setIsLogin(true);
        setAlertModal({ isOpen: true, message: '회원가입이 완료되었습니다. 로그인해주세요.', type: 'success' });
      }
    } catch (err) {

    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">{isLogin ? '로그인' : '회원가입'}</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">이름</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>성별</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === true}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: true }))}
                      required={!isLogin}
                    />
                    <span>남성</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === false}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: false }))}
                      required={!isLogin}
                    />
                    <span>여성</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && (
            <div className="error-message">
              {error.message}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="switch-mode">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              clearError();
              setFormData({
                name: '',
                email: '',
                password: '',
                gender: null,
              });
            }}
            className="switch-button"
          >
            {isLogin ? '회원가입' : '로그인'}으로 전환
          </button>
        </div>
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default LoginPage;
