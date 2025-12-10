#!/bin/bash
echo "=== API 엔드포인트 확인 ==="
echo ""
echo "Auth API:"
grep -r "auth/" src/services/api/auth.ts | grep -E "(post|get|put|delete)" | head -5
echo ""
echo "Articles API:"
grep -r "/api/articles" src/services/api/articles.ts | grep -E "(post|get|put|delete)" | head -10
echo ""
echo "Comments API:"
grep -r "/api/articles.*comments" src/services/api/comments.ts | head -5
echo ""
echo "Tags API:"
grep -r "/api.*tags" src/services/api/tags.ts | head -5
echo ""
echo "Likes API:"
grep -r "/api.*like" src/services/api/likes.ts | head -5
