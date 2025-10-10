# API Endpoints Documentation for Postman

## Authentication
All endpoints require JWT authentication. Include the following header:
```
Authorization: Bearer <your_jwt_token>
```

## User Authentication Endpoints

### 1. Register with Email
- **Method**: POST
- **Endpoint**: `/api/auth/register`
- **Description**: Register a new user account
- **Required Fields**: email, password, full_name, date_of_birth, location
- **Payload**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "confirm_password": "securePassword123",
  "full_name": "Nguyen Van A",
  "date_of_birth": "1990-01-15",
  "location": "Ho Chi Minh City"
}
```
- **Response**:
```json
{
  "message": "Register successful",
  "user": {
    "id": "user-uuid",
    "username": "generated_username",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "location": "Ho Chi Minh City",
    "role": "user"
  },
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token"
}
```

### 2. Login with Email
- **Method**: POST
- **Endpoint**: `/api/auth/login`
- **Payload**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 3. Get User Profile
- **Method**: GET
- **Endpoint**: `/api/auth/profile`
- **Headers**: Authorization: Bearer <token>

### 4. Logout
- **Method**: POST
- **Endpoint**: `/api/auth/logout`
- **Headers**: Authorization: Bearer <token>

## Questions API Endpoints

### 1. Get All Questions
- **Method**: GET
- **Endpoint**: `/api/questions/`
- **Description**: Get all questions with templates and relationships
- **Response**: Array of all questions

### 2. Get Random Questions (Simple Format)
- **Method**: GET  
- **Endpoint**: `/api/questions/random-simple`
- **Query Parameters**: 
  - `limit` (optional): Number of questions to return (default: 10, max: 50)
- **Example**: `/api/questions/random-simple?limit=15`
- **Response Format**:
```json
{
  "message": "Random questions retrieved successfully",
  "data": [
    {
      "id": "question-uuid",
      "question": "Question text here",
      "templateId": "T_FREQ_01",
      "behaviorInput": "Behavior description",
      "behaviorNormalized": "frequency",
      "template": {
        "id": "T_FREQ_01",
        "name": "Template name",
        "description": "Template description",
        "intent": "frequency",
        "question_type": "frequency"
      },
      "options": [
        {"text": "Option 1", "value": "1", "order": 0},
        {"text": "Option 2", "value": "2", "order": 1}
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 10
}
```

### 3. Get Random Questions (Grouped Format)
- **Method**: GET
- **Endpoint**: `/api/questions/random`
- **Query Parameters**: 
  - `limit` (optional): Number of questions to return (default: 10, max: 50)
- **Response**: Questions grouped by OCEAN traits and question types

### 4. Get Questions for Client (Static Format)
- **Method**: GET
- **Endpoint**: `/api/questions/for-client`
- **Description**: Returns predefined static questions format
- **Response**: Predefined question structure grouped by OCEAN traits

### 5. Get Question by ID
- **Method**: GET
- **Endpoint**: `/api/questions/{question-id}`
- **Description**: Get a specific question by its UUID
- **Example**: `/api/questions/123e4567-e89b-12d3-a456-426614174000`

### 6. Get Questions by Template ID
- **Method**: GET
- **Endpoint**: `/api/questions/template/{template-id}`
- **Description**: Get all questions for a specific template

### 7. Get Questions by Thread Hall ID
- **Method**: GET
- **Endpoint**: `/api/questions/threadhall/{threadhall-id}`
- **Description**: Get all questions for a specific thread hall

### 8. Create Templates
- **Method**: POST
- **Endpoint**: `/api/templates/createTemplates`
- **Payload**:
```json
{
  "templates": [
    {
      "id": "T_FREQ_01",
      "name": "Template name",
      "description": "Template description",
      "intent": "frequency",
      "placeholders": {
        "required": ["ocean", "keywords"],
        "optional": ["behavior", "age", "gender", "location"],
        "used_placeholders": ["ocean", "gender", "age", "keywords"]
      },
      "prompt": "Template prompt with {placeholders}",
      "question_type": "frequency",
      "answer": {
        "type": "scale",
        "scale": [1, 2, 3, 4],
        "labels": ["Label 1", "Label 2", "Label 3", "Label 4"]
      },
      "filled_prompt": "Filled template prompt"
    }
  ]
}
```

### 9. Create Questions
- **Method**: POST
- **Endpoint**: `/api/questions/createQuestions`
- **Payload**:
```json
{
  "questions": [
    {
      "id": "T_FREQ_01",
      "name": "Question name",
      "intent": "frequency",
      "question_type": "frequency",
      "filled_prompt": "The actual question text",
      "answer": {
        "type": "scale",
        "scale": [1, 2, 3, 4],
        "labels": ["Option 1", "Option 2", "Option 3", "Option 4"]
      }
    }
  ]
}
```

## Models API Endpoints

### 10. Create Model
- **Method**: POST
- **Endpoint**: `/api/models/create`
- **Payload**:
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

### 11. Get All Models
- **Method**: GET
- **Endpoint**: `/api/models/`
- **Description**: Get all models from database

### 12. Get Survey Questions (Personalized)
- **Method**: GET
- **Endpoint**: `/api/questions/survey`
- **Headers**: Authorization: Bearer <token>
- **Query Parameters**: 
  - `limit` (optional): Number of questions to return (default: 20, max: 50)
- **Example**: `/api/questions/survey?limit=25`
- **Description**: Get questions filtered by user's location and age from JWT token
- **Response Format**:
```json
{
  "message": "Survey questions retrieved successfully",
  "data": [
    {
      "id": "question-uuid",
      "question": "Người có tính cách E, giới tính Nữ, độ tuổi 34, yêu thích hành động ăn mỳ quảng ở Quảng Nam ở mức nào?",
      "templateId": "T_LIKERT_01",
      "behaviorInput": "Mức độ yêu thích hành động 1",
      "behaviorNormalized": "likert5",
      "template": {
        "id": "T_LIKERT_01",
        "name": "Mức độ yêu thích hành động 1",
        "description": "Đánh giá mức độ yêu thích hành động cụ thể.",
        "intent": "likert5",
        "question_type": "likert5"
      },
      "options": [
        {"text": "Rất không thích", "value": "1", "order": 0},
        {"text": "Không thích", "value": "2", "order": 1},
        {"text": "Bình thường", "value": "3", "order": 2},
        {"text": "Thích", "value": "4", "order": 3},
        {"text": "Rất thích", "value": "5", "order": 4}
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 20,
  "userInfo": {
    "userId": "user-uuid",
    "location": "Quảng Nam",
    "age": 34,
    "filteredCount": 15,
    "randomCount": 5
  }
}
```

## Important Notes

1. **Route Order**: Specific routes (like `/random-simple`) must be defined before parameterized routes (like `/:id`) in Express.js
2. **Authentication**: All endpoints require valid JWT token
3. **CORS**: API accepts requests from any origin (`*`)
4. **Error Handling**: All endpoints return consistent error format with message and details

## Common Error Responses

### Invalid ID Format
```json
{
  "message": "Invalid question ID format",
  "errors": {
    "_errors": [],
    "id": {
      "_errors": ["Invalid question ID"]
    }
  }
}
```

### Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### Not Found
```json
{
  "message": "Question not found"
}
```

## Testing with Postman

1. First authenticate to get JWT token
2. Add `Authorization: Bearer <token>` header to all requests
3. Use correct HTTP methods (GET, POST, PUT, DELETE)
4. For POST requests, set `Content-Type: application/json`
5. Ensure you're calling the correct endpoint URLs

## Troubleshooting

If you get "Invalid question ID format" error:
1. Check that you're calling the correct endpoint
2. Ensure specific routes like `/random-simple` don't have typos
3. Verify your JWT token is valid
4. Check that the route order in the backend is correct (specific routes before parameterized routes)
