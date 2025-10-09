## Locations API

### [POST] /api/locations/create
Tạo location mới
```json
{
  "latitude": 0.0,
  "longitude": 0.0,
  "address": "string",
  "userId": "string"
}
```

### [GET] /api/locations/getAll
Lấy danh sách tất cả locations
```json
{}
```

### [GET] /api/locations/:id
Lấy location theo ID
```json
{}
```

### [PUT] /api/locations/:id
Cập nhật location
```json
{
  "latitude": 0.0,
  "longitude": 0.0,
  "address": "string"
}
```

### [DELETE] /api/locations/:id
Xóa location
```json
{}
```

## Big Five API

### [POST] /api/bigfive/create
Tạo big five assessment mới
```json
{
  "openness": 0.0,
  "conscientiousness": 0.0,
  "extraversion": 0.0,
  "agreeableness": 0.0,
  "neuroticism": 0.0,
  "userId": "string"
}
```

### [GET] /api/bigfive/getAll
Lấy danh sách tất cả big five assessments
```json
{}
```

### [GET] /api/bigfive/:id
Lấy big five assessment theo ID
```json
{}
```

### [PUT] /api/bigfive/:id
Cập nhật big five assessment
```json
{
  "openness": 0.0,
  "conscientiousness": 0.0,
  "extraversion": 0.0,
  "agreeableness": 0.0,
  "neuroticism": 0.0
}
```

### [DELETE] /api/bigfive/:id
Xóa big five assessment
```json
{}
```

## Food Items API

### [POST] /api/fooditems/create
Tạo food item mới
```json
{
  "name": "string",
  "barcode": "string",
  "caloriesId": "string"
}
```

### [GET] /api/fooditems/getAll
Lấy danh sách tất cả food items
```json
{}
```

### [GET] /api/fooditems/:id
Lấy food item theo ID
```json
{}
```

### [PUT] /api/fooditems/:id
Cập nhật food item
```json
{
  "name": "string",
  "barcode": "string",
  "caloriesId": "string"
}
```

### [DELETE] /api/fooditems/:id
Xóa food item
```json
{}
```

## Calories API

### [POST] /api/calories/create
Tạo calorie record mới
```json
{
  "energy_kcal": 0.0,
  "protein_g": 0.0,
  "fat_g": 0.0,
  "carbs_g": 0.0
}
```

### [GET] /api/calories/getAll
Lấy danh sách tất cả calorie records
```json
{}
```

### [GET] /api/calories/:id
Lấy calorie record theo ID
```json
{}
```

### [PUT] /api/calories/:id
Cập nhật calorie record
```json
{
  "energy_kcal": 0.0,
  "protein_g": 0.0,
  "fat_g": 0.0,
  "carbs_g": 0.0
}
```

### [DELETE] /api/calories/:id
Xóa calorie record
```json
{}
```

## Scans API

### [POST] /api/scans/create
Tạo scan mới
```json
{
  "scan_time": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "foodItemsId": "string",
  "userId": "string"
}
```

### [GET] /api/scans/getAll
Lấy danh sách tất cả scans
```json
{}
```

### [GET] /api/scans/:id
Lấy scan theo ID
```json
{}
```

### [PUT] /api/scans/:id
Cập nhật scan
```json
{
  "scan_time": "YYYY-MM-DDTHH:mm:ss.sssZ",
  "foodItemsId": "string"
}
```

### [DELETE] /api/scans/:id
Xóa scan
```json
{}
```

## Invoices API

### [POST] /api/invoices/create
Tạo invoice mới
```json
{
  "issued_at": "HH:mm:ss+TZ",
  "userId": "string",
  "scansId": "string"
}
```

### [GET] /api/invoices/getAll
Lấy danh sách tất cả invoices
```json
{}
```

### [GET] /api/invoices/:id
Lấy invoice theo ID
```json
{}
```

### [PUT] /api/invoices/:id
Cập nhật invoice
```json
{
  "issued_at": "HH:mm:ss+TZ",
  "scansId": "string"
}
```

### [DELETE] /api/invoices/:id
Xóa invoice
```json
{}
```

## User Answers API

### [POST] /api/useranswers/create
Tạo user answer mới
```json
{
  "user_id": "string",
  "question_id": "string",
  "answer": "string",
  "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ"
}
```

### [GET] /api/useranswers/getAll
Lấy danh sách tất cả user answers
```json
{}
```

### [GET] /api/useranswers/:userId/:questionId
Lấy user answer theo user ID và question ID
```json
{}
```

### [PUT] /api/useranswers/:userId/:questionId
Cập nhật user answer
```json
{
  "answer": "string",
  "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ"
}
```

### [DELETE] /api/useranswers/:userId/:questionId
Xóa user answer
```json
{}
```

## Health Check API

### [GET] /api/check/health
Kiểm tra health của server
```json
{}
```

## Token API

### [POST] /api/tokens/refresh
Refresh JWT token
```json
{
  "refreshToken": "string"
}
```

### [POST] /api/tokens/logout
Logout và invalidate token
```json
{
  "token": "string"
}
```

---

## Response Format
Tất cả responses đều có format sau:

### Success Response
```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "string",
  "errors": []
}
```

## Status Codes
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

