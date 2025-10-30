
## Health Check

### [Health] GET /api/health
No authentication required

## Token Management

### [Tokens] POST /api/tokens/refresh
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

### [Tokens] DELETE /api/tokens/revoke
```json
{
  "token": "token_to_revoke"
}
```

## Common Response Formats

### Success Response
```json
{
  "message": "Operation completed successfully",
  "data": {},
  "count": 1
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": {
    "field_name": {
      "_errors": ["Error description"]
    }
  }
}
```

### Validation Error Response
```json
{
  "message": "Validation error",
  "errors": {
    "_errors": [],
    "field_name": {
      "_errors": ["Field is required"]
    }
  }
}
```

## Environment Variables Required

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=greenmind
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3000
```

## Notes

- All endpoints require valid JWT token in Authorization header (except auth and health endpoints)
- Admin endpoints require admin role
- UUIDs should be valid v4 format
- Dates should be in ISO 8601 format
- All responses are in JSON format
- CORS is enabled for all origins (*)
# Green MindMap Backend - Postman API Documentation

## Authentication Endpoints

### [Auth] POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "username": "johndoe",
  "phoneNumber": "+84901234567",
  "dateOfBirth": "1990-01-01",
  "location": "Ho Chi Minh City"
}
```

### [Auth] POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### [Auth] POST /api/auth/logout
```json
{
  "token": "your_jwt_token_here"
}
```

## User Management

### [User] GET /api/users/profile
Headers: `Authorization: Bearer <token>`

### [User] PUT /api/users/profile
```json
{
  "fullName": "John Smith",
  "phoneNumber": "+84901234567",
  "location": "Da Nang"
}
```

### [User] GET /api/users
Headers: `Authorization: Bearer <token>` (Admin only)

## Big Five Personality

### [BigFive] POST /api/big-five
```json
{
  "openness": 4.2,
  "conscientiousness": 3.8,
  "extraversion": 3.5,
  "agreeableness": 4.0,
  "neuroticism": 2.3
}
```

### [BigFive] GET /api/big-five/:userId
Headers: `Authorization: Bearer <token>`

## Templates Management

### [Templates] POST /api/templates/create-templates
```json
{
  "templates": [
    {
      "id": "T_FREQ_01",
      "name": "Tần suất thực hiện hành động 1",
      "description": "Khảo sát tần suất người tham gia một hành động cụ thể",
      "intent": "frequency",
      "placeholders": {
        "required": ["ocean", "keywords"],
        "optional": ["behavior", "age", "gender", "location"],
        "used_placeholders": ["ocean", "gender", "age", "keywords"]
      },
      "prompt": "Người có tính cách {ocean}, giới tính {gender}, độ tuổi {age}, mức độ yêu thích hành động {keywords} là như thế nào?",
      "question_type": "frequency",
      "answer": {
        "type": "scale",
        "scale": [1, 2, 3, 4],
        "labels": ["Không bao giờ", "Thỉnh thoảng", "Thường xuyên", "Rất thường xuyên"]
      },
      "filled_prompt": "Người có tính cách E, giới tính Nữ, độ tuổi 34, mức độ yêu thích hành động ăn mỳ quảng ở quảng nam là như thế nào?"
    }
  ]
}
```

### [Templates] GET /api/templates
Headers: `Authorization: Bearer <token>`

### [Templates] GET /api/templates/:id
Headers: `Authorization: Bearer <token>`

### [Templates] PUT /api/templates/:id
```json
{
  "text": "Updated template text",
  "trait": "E",
  "placeholder": ["behavior", "location"],
  "questionType": "frequency"
}
```

### [Templates] DELETE /api/templates/:id
Headers: `Authorization: Bearer <token>`

## Questions Management

### [Questions] POST /api/questions/create-questions
```json
{
  "questions": [
    {
      "id": "T_FREQ_01",
      "name": "Tần suất thực hiện hành động 1",
      "intent": "frequency",
      "question_type": "frequency",
      "filled_prompt": "Người có tính cách E, giới tính Nữ, độ tuổi 34, mức độ yêu thích hành động ăn mỳ quảng ở quảng nam là như thế nào?",
      "answer": {
        "type": "scale",
        "scale": [1, 2, 3, 4],
        "labels": ["Không bao giờ", "Thỉnh thoảng", "Thường xuyên", "Rất thường xuyên"]
      }
    }
  ]
}
```

### [Questions] GET /api/questions
Headers: `Authorization: Bearer <token>`

### [Questions] GET /api/questions/:id
Headers: `Authorization: Bearer <token>`

### [Questions] GET /api/questions/random
Headers: `Authorization: Bearer <token>`
Query params: `?limit=10`

### [Questions] GET /api/questions/survey
Headers: `Authorization: Bearer <token>`
Query params: `?limit=20`

### [Questions] PUT /api/questions/:id
```json
{
  "question": "Updated question text",
  "templateId": "template-uuid-here"
}
```

### [Questions] DELETE /api/questions/:id
Headers: `Authorization: Bearer <token>`

## Models Management

### [Models] POST /api/models
```json
{
  "ocean": "E",
  "behavior": "ăn uống",
  "age": "34",
  "location": "Quảng Nam",
  "gender": "Nữ",
  "keywords": "ăn mỳ quảng ở quảng nam"
}
```

### [Models] GET /api/models
Headers: `Authorization: Bearer <token>`

## User Answers

### [UserAnswers] POST /api/user-answers
```json
{
  "questionId": "question-uuid-here",
  "answer": "Thường xuyên"
}
```

### [UserAnswers] GET /api/user-answers/user/:userId
Headers: `Authorization: Bearer <token>`

### [UserAnswers] GET /api/user-answers/question/:questionId
Headers: `Authorization: Bearer <token>`

## Behaviors Management

### [Behaviors] POST /api/behaviors
```json
{
  "name": "ăn uống",
  "type": "daily_activity",
  "keywords": ["ăn", "uống", "thức ăn", "đồ uống"],
  "description": "Hành vi liên quan đến việc ăn uống hàng ngày"
}
```

### [Behaviors] GET /api/behaviors
Headers: `Authorization: Bearer <token>`

### [Behaviors] GET /api/behaviors/:id
Headers: `Authorization: Bearer <token>`

### [Behaviors] PUT /api/behaviors/:id
```json
{
  "name": "Updated behavior name",
  "keywords": ["keyword1", "keyword2"]
}
```

### [Behaviors] DELETE /api/behaviors/:id
Headers: `Authorization: Bearer <token>`

## Thread Halls Management

### [ThreadHalls] POST /api/thread-halls
```json
{
  "name": "Extraversion Discussion",
  "description": "Thread hall for discussing extraversion traits",
  "traitsId": "trait-uuid-here"
}
```

### [ThreadHalls] GET /api/thread-halls
Headers: `Authorization: Bearer <token>`

### [ThreadHalls] GET /api/thread-halls/:id
Headers: `Authorization: Bearer <token>`

### [ThreadHalls] PUT /api/thread-halls/:id
```json
{
  "name": "Updated thread hall name",
  "description": "Updated description"
}
```

### [ThreadHalls] DELETE /api/thread-halls/:id
Headers: `Authorization: Bearer <token>`

## Traits Management

### [Traits] POST /api/traits
```json
{
  "name": "Extraversion",
  "description": "Tendency to be sociable and outgoing",
  "label": "E"
}
```

### [Traits] GET /api/traits
Headers: `Authorization: Bearer <token>`

### [Traits] GET /api/traits/:id
Headers: `Authorization: Bearer <token>`

### [Traits] PUT /api/traits/:id
```json
{
  "name": "Updated trait name",
  "description": "Updated description"
}
```

### [Traits] DELETE /api/traits/:id
Headers: `Authorization: Bearer <token>`

## Locations Management

### [Locations] POST /api/locations
```json
{
  "latitude": 10.8231,
  "longitude": 106.6297,
  "address": "Ho Chi Minh City, Vietnam"
}
```

### [Locations] GET /api/locations
Headers: `Authorization: Bearer <token>`

### [Locations] GET /api/locations/user/:userId
Headers: `Authorization: Bearer <token>`

## Food & Nutrition

### [Calories] POST /api/calories
```json
{
  "energy_kcal": 250.5,
  "protein_g": 12.3,
  "fat_g": 8.7,
  "carbs_g": 35.2
}
```

### [FoodItems] POST /api/food-items
```json
{
  "name": "Banana",
  "barcode": "1234567890123",
  "caloriesId": "calories-uuid-here"
}
```

### [Scans] POST /api/scans
```json
{
  "foodItemsId": "food-item-uuid-here",
  "scan_time": "2024-01-15T10:30:00Z"
}
```

### [Invoices] POST /api/invoices
```json
{
  "issued_at": "2024-01-15T10:30:00Z",
  "scansId": "scan-uuid-here"
}
```
