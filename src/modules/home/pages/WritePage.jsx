import { useState, useEffect, useRef } from 'react';
import { articlesApi } from '../../../services/api/articles';
import { tagsApi } from '../../../services/api/tags';
import { tokenUtils } from '../../../utils/token';
import { parseMarkdown } from '../../../utils/markdown';
import AlertModal from '../../../components/AlertModal';
import '../styles/WritePage.css';

const DRAFT_STORAGE_KEY = 'article_draft';
const DRAFT_DECLINED_KEY = 'article_draft_declined';

function WritePage() {

  const path = window.location.pathname;
  const editMatch = path.match(/^\/edit\/(\d+)$/);
  const articleId = editMatch ? parseInt(editMatch[1], 10) : null;
  const isEditMode = !!articleId;

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const contentRef = useRef(null);
  const tagInputRef = useRef(null);

  useEffect(() => {
    if (isEditMode && articleId) {
      loadArticleForEdit();
    }
  }, [isEditMode, articleId]);

  const loadArticleForEdit = async () => {
    setLoadingArticle(true);
    try {
      const article = await articlesApi.getById(articleId);
      setTitle(article.title);
      setContent(article.content);
      setThumbnailUrl(article.thumbnailUrl || '');
      
      try {
        const tagList = await tagsApi.getArticleTags(articleId);
        setTags(tagList.map(tag => tag.name));
      } catch (tagErr) {
        console.error('태그 로딩 실패:', tagErr);
        setTags([]);
      }
    } catch (err) {
      console.error('글 로딩 실패:', err);
      if (err instanceof Error) {
        setAlertModal({ 
          isOpen: true, 
          message: err.message || '글을 불러오는데 실패했습니다.', 
          type: 'error',
          onClose: () => {
            setAlertModal({ isOpen: false, message: '', type: 'info' });
            window.location.href = '/';
          }
        });
      }
    } finally {
      setLoadingArticle(false);
    }
  };

  useEffect(() => {
    if (isEditMode) return;
    
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    const declinedInfo = localStorage.getItem(DRAFT_DECLINED_KEY);
    
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content || draft.tags?.length > 0) {

          let shouldShow = true;
          if (declinedInfo) {
            try {
              const declined = JSON.parse(declinedInfo);
              const draftSavedAt = new Date(draft.savedAt || 0);
              const declinedAt = new Date(declined.declinedAt || 0);
              
              if (draftSavedAt <= declinedAt) {
                shouldShow = false;
              }
            } catch (e) {

            }
          }
          
          if (shouldShow) {
            if (window.confirm('임시저장된 글이 있습니다. 불러오시겠습니까?')) {
              setTitle(draft.title || '');
              setContent(draft.content || '');
              setTags(draft.tags || []);
              setThumbnailUrl(draft.thumbnailUrl || '');

              localStorage.removeItem(DRAFT_DECLINED_KEY);
            } else {

              localStorage.setItem(DRAFT_DECLINED_KEY, JSON.stringify({
                declinedAt: new Date().toISOString(),
                draftSavedAt: draft.savedAt,
              }));
            }
          }
        }
      } catch (e) {
        console.error('임시저장 불러오기 실패:', e);
      }
    }
  }, [isEditMode]);

  useEffect(() => {

    if (isExiting) {
      return;
    }

    const timer = setTimeout(() => {
      if (title || content || tags.length > 0 || thumbnailUrl) {
        const savedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
          title,
          content,
          tags,
          thumbnailUrl,
          savedAt,
        }));
        
        const declinedInfo = localStorage.getItem(DRAFT_DECLINED_KEY);
        if (declinedInfo) {
          try {
            const declined = JSON.parse(declinedInfo);
            const declinedAt = new Date(declined.declinedAt || 0);
            const newSavedAt = new Date(savedAt);
            
            if (newSavedAt > declinedAt) {
              localStorage.removeItem(DRAFT_DECLINED_KEY);
            }
          } catch (e) {

          }
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, tags, isExiting]);

  const insertText = (before, after = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatHeading = (level) => {
    const heading = '#'.repeat(level) + ' ';
    insertText(heading, '');
  };

  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatStrikethrough = () => insertText('~~', '~~');
  const formatBlockquote = () => insertText('> ', '');
  const formatCode = () => insertText('`', '`');
  const formatCodeBlock = () => insertText('```\n', '\n```');

  const formatLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      const text = contentRef.current?.value.substring(
        contentRef.current.selectionStart,
        contentRef.current.selectionEnd
      ) || '링크 텍스트';
      insertText(`[${text}](`, ')');
    }
  };

  const formatImage = () => {
    const url = prompt('이미지 URL을 입력하세요:');
    if (!url) return;
    
    const alt = prompt('이미지 설명을 입력하세요 (선택, 취소하면 빈 값):');
    const altText = alt !== null ? alt : '';
    
    const imageMarkdown = `![${altText}](${url})`;
    
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + imageMarkdown + after;
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleTagKeyDown = (e) => {

    if (isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',') {

      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
        setTags(prev => [...prev, trimmed]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    
    if (!isComposing && value.includes(',')) {

      const commaIndex = value.indexOf(',');
      const beforeComma = value.substring(0, commaIndex).trim();
      const afterComma = value.substring(commaIndex + 1);
      
      if (beforeComma && !tags.includes(beforeComma) && tags.length < 10) {
        setTags(prev => [...prev, beforeComma]);
      }
      
      setTagInput(afterComma);
    } else {

      setTagInput(value);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveDraft = () => {
    setSaving(true);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        title,
        content,
        tags,
        thumbnailUrl,
        savedAt: new Date().toISOString(),
      }));
      setAlertModal({ isOpen: true, message: '임시저장되었습니다.', type: 'success' });
    } catch (e) {
      console.error('임시저장 실패:', e);
      setAlertModal({ isOpen: true, message: '임시저장에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError(null);

    const token = tokenUtils.getAccessToken();
    if (!token) {
      setError('로그인이 필요합니다.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {

        console.log('📝 글 수정 시작...', articleId);
        console.log('   제목:', title.trim());
        console.log('   내용 길이:', content.trim().length);
        console.log('   태그:', tags);
        console.log('   썸네일:', thumbnailUrl && thumbnailUrl.trim() ? thumbnailUrl.trim() : '없음');

        const updateData = {
          title: title.trim(),
          content: content.trim(),
        };
        if (thumbnailUrl && thumbnailUrl.trim()) {
          updateData.thumbnailUrl = thumbnailUrl.trim();
        }

        const response = await articlesApi.update(articleId, updateData);

        console.log('✅ 글 수정 성공:', response);

        try {
          console.log('🏷️ 태그 수정 시작...');
          console.log('   태그 목록:', tags);
          await tagsApi.updateArticleTags(articleId, {
            tags: tags,
          });
          console.log('✅ 태그 수정 성공');
        } catch (tagError) {
          console.error('❌ 태그 수정 실패:', tagError);
          if (tagError instanceof Error) {
            console.error('   에러 메시지:', tagError.message);
          }

          setAlertModal({ isOpen: true, message: '글이 수정되었지만 태그 수정에 실패했습니다.', type: 'warning' });
        }

        setAlertModal({ 
          isOpen: true, 
          message: '글이 수정되었습니다.', 
          type: 'success',
          onClose: () => {
            setAlertModal({ isOpen: false, message: '', type: 'info' });
            window.location.href = `/article/${articleId}`;
          }
        });
      } else {

        console.log('📝 글 작성 시작...');
        console.log('   제목:', title.trim());
        console.log('   내용 길이:', content.trim().length);
        console.log('   태그:', tags);
        console.log('   썸네일:', thumbnailUrl && thumbnailUrl.trim() ? thumbnailUrl.trim() : '없음');

        const createData = {
          title: title.trim(),
          content: content.trim(),
        };
        if (thumbnailUrl && thumbnailUrl.trim()) {
          createData.thumbnailUrl = thumbnailUrl.trim();
        }

        const response = await articlesApi.create(createData);

        console.log('✅ 글 작성 성공:', response);
        console.log('   글 ID:', response.id);

        if (tags.length > 0) {
          try {
            console.log('🏷️ 태그 추가 시작...');
            console.log('   태그 목록:', tags);
            const tagResponse = await tagsApi.updateArticleTags(response.id, {
              tags: tags,
            });
            console.log('✅ 태그 추가 성공:', tagResponse);
          } catch (tagError) {
            console.error('❌ 태그 추가 실패:', tagError);
            if (tagError instanceof Error) {
              console.error('   에러 메시지:', tagError.message);
              console.error('   에러 스택:', tagError.stack);
            }

            setAlertModal({ isOpen: true, message: '글이 작성되었지만 태그 추가에 실패했습니다.', type: 'warning' });
          }
        }

        localStorage.removeItem(DRAFT_STORAGE_KEY);

        setTitle('');
        setContent('');
        setTags([]);
        setTagInput('');
        setThumbnailUrl('');
        setError(null);

        setAlertModal({ 
          isOpen: true, 
          message: '글이 출간되었습니다.', 
          type: 'success',
          onClose: () => {
            setAlertModal({ isOpen: false, message: '', type: 'info' });
            window.location.href = '/';
          }
        });
      }
    } catch (err) {
      console.error(`❌ 글 ${isEditMode ? '수정' : '작성'} 에러:`, err);
      if (err instanceof Error) {
        console.error('   에러 메시지:', err.message);
        console.error('   에러 스택:', err.stack);
        setError(err.message || `글 ${isEditMode ? '수정' : '작성'}에 실패했습니다.`);
      } else {
        console.error('   알 수 없는 에러:', err);
        setError(`글 ${isEditMode ? '수정' : '작성'}에 실패했습니다.`);
      }
      
      if (err instanceof Error && err.message) {
        setError(`서버 에러: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    if (title || content || tags.length > 0) {
      if (!window.confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        return;
      }
    }
    
    setIsExiting(true);
    
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    
    window.location.href = '/';
  };

  return (
    <div className="write-page">
      <div className="write-editor-container">

        <div className="write-editor">

          <div className="editor-section">
            <div className="title-section">
              <input
                type="text"
                className="title-input"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading || loadingArticle}
              />
            </div>

            <div className="tag-section">
              <div className="tag-input-wrapper">
                <input
                  ref={tagInputRef}
                  type="text"
                  className="tag-input"
                  placeholder="태그를 입력하세요"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  disabled={loading}
                />
                {tags.length > 0 && (
                  <div className="tag-list">
                    {tags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        {tag}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeTag(tag)}
                          disabled={loading}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="thumbnail-section">
              <label className="thumbnail-label">썸네일 이미지 URL (선택)</label>
              <input
                type="url"
                className="thumbnail-input"
                placeholder="https://example.com/image.jpg"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                disabled={loading || loadingArticle}
              />
              {thumbnailUrl && (
                <div className="thumbnail-preview">
                  <img src={thumbnailUrl} alt="썸네일 미리보기" onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }} />
                  <div className="thumbnail-error" style={{ display: 'none' }}>
                    이미지를 불러올 수 없습니다.
                  </div>
                </div>
              )}
            </div>

            <div className="toolbar">
              <button type="button" className="toolbar-btn" onClick={() => formatHeading(1)} title="H1">
                H1
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatHeading(2)} title="H2">
                H2
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatHeading(3)} title="H3">
                H3
              </button>
              <button type="button" className="toolbar-btn" onClick={() => formatHeading(4)} title="H4">
                H4
              </button>
              <div className="toolbar-divider"></div>
              <button type="button" className="toolbar-btn" onClick={formatBold} title="Bold">
                <strong>B</strong>
              </button>
              <button type="button" className="toolbar-btn" onClick={formatItalic} title="Italic">
                <em>I</em>
              </button>
              <button type="button" className="toolbar-btn" onClick={formatStrikethrough} title="Strikethrough">
                <span style={{ textDecoration: 'line-through' }}>S</span>
              </button>
              <div className="toolbar-divider"></div>
              <button type="button" className="toolbar-btn" onClick={formatBlockquote} title="Blockquote">
                "
              </button>
              <button type="button" className="toolbar-btn" onClick={formatLink} title="Link">
                🔗
              </button>
              <button type="button" className="toolbar-btn" onClick={formatImage} title="Image">
                🖼️
              </button>
              <button type="button" className="toolbar-btn" onClick={formatCode} title="Inline Code">
                {'</>'}
              </button>
              <button type="button" className="toolbar-btn" onClick={formatCodeBlock} title="Code Block">
                {'</>'}
              </button>
            </div>
          </div>

          <div className="editor-section">
            {loadingArticle ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#868e96' }}>
                글을 불러오는 중...
              </div>
            ) : (
              <textarea
                ref={contentRef}
                className="content-textarea"
                placeholder="당신의 이야기를 적어보세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading || loadingArticle}
              />
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="write-preview">
          <div className="preview-header">
            <h3>미리보기</h3>
          </div>
          <div className="preview-content">
            {title && (
              <h1 className="preview-title">{title}</h1>
            )}
            {tags.length > 0 && (
              <div className="preview-tags">
                {tags.map((tag, index) => (
                  <span key={index} className="preview-tag">{tag}</span>
                ))}
              </div>
            )}
            <div 
              className="preview-body"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
            {!title && !content && (
              <div className="preview-empty">
                작성한 내용이 여기에 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="write-footer">
        <button
          type="button"
          className="exit-button"
          onClick={handleExit}
          disabled={loading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          나가기
        </button>
        <div className="footer-actions">
          <button
            type="button"
            className="draft-button"
            onClick={handleSaveDraft}
            disabled={loading || saving}
          >
            {saving ? '저장 중...' : '임시저장'}
          </button>
          <button
            type="button"
            className="publish-button"
            onClick={handlePublish}
            disabled={loading || loadingArticle || !title.trim() || !content.trim()}
          >
            {loading ? (isEditMode ? '수정 중...' : '출간 중...') : (isEditMode ? '수정하기' : '출간하기')}
          </button>
        </div>
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => {
          if (alertModal.onClose) {
            alertModal.onClose();
          } else {
            setAlertModal({ isOpen: false, message: '', type: 'info' });
          }
        }}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default WritePage;
