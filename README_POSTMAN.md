# Hướng dẫn thêm API Endpoints vào Postman

## Authentication Endpoints

### [Auth] POST /api/users/register
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123",
  "fullName": "Test User",
  "phoneNumber": "0123456789",
  "location": "Hà Nội",
  "dateOfBirth": "1990-01-01"
}
```

### [Auth] POST /api/users/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### [Auth] POST /api/users/login-email
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### [Auth] POST /api/tokens/refresh
```json
{
  "refreshToken": "your_refresh_token"
}
```

## User Management Endpoints

### [User] GET /api/users/profile
Headers: `Authorization: Bearer {token}`

### [User] PUT /api/users/profile
Headers: `Authorization: Bearer {token}`
```json
{
  "fullName": "Updated Name",
  "phoneNumber": "0987654321",
  "location": "TP.HCM",
  "dateOfBirth": "1995-05-15"
}
```

### [User] GET /api/users (Admin only)
Headers: `Authorization: Bearer {admin_token}`

## Template Management Endpoints

### [Template] POST /api/templates/createTemplates
Headers: `Authorization: Bearer {token}`
```json
{
  "templates": [
    {
      "id": "T_FREQ_01",
      "name": "Tần suất thực hiện hành động 1",
      "description": "Khảo sát tần suất người tham gia một hành động cụ thể.",
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

### [Template] GET /api/templates
Headers: `Authorization: Bearer {token}`

### [Template] GET /api/templates/{id}
Headers: `Authorization: Bearer {token}`

### [Template] POST /api/templates
Headers: `Authorization: Bearer {token}`
```json
{
  "text": "Template text with {placeholder}",
  "trait": "frequency",
  "placeholder": ["behavior", "location"],
  "questionType": "frequency"
}
```

## Question Management Endpoints

### [Question] POST /api/questions/createQuestions
Headers: `Authorization: Bearer {token}`
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

### [Question] GET /api/questions/survey
Headers: `Authorization: Bearer {token}`
Query: `?limit=20`

### [Question] GET /api/questions/random
Headers: `Authorization: Bearer {token}`
Query: `?limit=10`

### [Question] GET /api/questions/random-simple
Headers: `Authorization: Bearer {token}`
Query: `?limit=10`

### [Question] GET /api/questions
Headers: `Authorization: Bearer {token}`

### [Question] GET /api/questions/{id}
Headers: `Authorization: Bearer {token}`

### [Question] POST /api/questions
Headers: `Authorization: Bearer {token}`
```json
{
  "question": "Bạn có thường xuyên ăn uống lành mạnh không?",
  "templateId": "template-uuid",
  "threadHallId": "threadhall-uuid"
}
```

## Model Management Endpoints

### [Model] POST /api/models/create
Headers: `Authorization: Bearer {token}`
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

### [Model] GET /api/models/all
Headers: `Authorization: Bearer {token}`

## Location Management Endpoints

### [Location] GET /api/locations
Headers: `Authorization: Bearer {token}`

### [Location] POST /api/locations
Headers: `Authorization: Bearer {token}`
```json
{
  "latitude": 16.047079,
  "longitude": 108.206230,
  "address": "Đà Nẵng, Việt Nam"
}
```

## Big Five Personality Endpoints

### [BigFive] POST /api/big-five
Headers: `Authorization: Bearer {token}`
```json
{
  "openness": 4.2,
  "conscientiousness": 3.8,
  "extraversion": 3.5,
  "agreeableness": 4.0,
  "neuroticism": 2.5
}
```

### [BigFive] GET /api/big-five/my-scores
Headers: `Authorization: Bearer {token}`

## User Answers Endpoints

### [UserAnswer] POST /api/user-answers
Headers: `Authorization: Bearer {token}`
```json
{
  "questionId": "question-uuid",
  "answer": "Có"
}
```

### [UserAnswer] GET /api/user-answers/my-answers
Headers: `Authorization: Bearer {token}`

## Thread Hall Endpoints

### [ThreadHall] GET /api/thread-halls
Headers: `Authorization: Bearer {token}`

### [ThreadHall] POST /api/thread-halls
Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Nhóm thảo luận ăn uống",
  "description": "Thảo luận về thói quen ăn uống lành mạnh",
  "traitsId": "trait-uuid"
}
```

## Behavior Endpoints

### [Behavior] GET /api/behaviors
Headers: `Authorization: Bearer {token}`

### [Behavior] POST /api/behaviors
Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Ăn uống lành mạnh",
  "type": "dietary",
  "keywords": ["ăn sạch", "thực phẩm organic", "rau xanh"],
  "description": "Thói quen ăn uống tốt cho sức khỏe"
}
```

## Trait Endpoints

### [Trait] GET /api/traits
Headers: `Authorization: Bearer {token}`

### [Trait] POST /api/traits
Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Extraversion",
  "description": "Mức độ hướng ngoại của cá nhân",
  "label": "E"
}
```

## Food & Nutrition Endpoints

### [FoodItem] GET /api/food-items
Headers: `Authorization: Bearer {token}`

### [FoodItem] POST /api/food-items
Headers: `Authorization: Bearer {token}`
```json
{
  "name": "Cơm gạo lứt",
  "barcode": "1234567890123"
}
```

### [Calorie] GET /api/calories
Headers: `Authorization: Bearer {token}`

### [Scan] POST /api/scans
Headers: `Authorization: Bearer {token}`
```json
{
  "foodItemsId": "food-item-uuid",
  "scanTime": "2024-01-01T12:00:00Z"
}
```

## Health Check Endpoints

### [Health] GET /api/check/health

### [Health] GET /api/check/database

## Notes:
- Tất cả API cần authentication (trừ register, login, health check) đều cần header: `Authorization: Bearer {token}`
- Thay thế `{token}` bằng JWT token nhận được từ login
- Thay thế các UUID placeholder bằng UUID thực từ database
- Admin endpoints cần token của user có role admin
- Các query parameters là optional
