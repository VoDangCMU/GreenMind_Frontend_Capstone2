# Survey Simulation - Duplicate Key Fix

## Vấn đề đã sửa

Lỗi: `duplicate key value violates unique constraint "REL_80cd28ac231072c3dbc1a2cc80"`

### Nguyên nhân:
- OneToOne relationship giữa `SurveyScenario` và `SimulatedSurvey` 
- Database có thể chứa records orphaned từ các lần simulate trước
- Constraint unique trên `scenarioId` trong bảng `simulated_survey`

## Giải pháp đã áp dụng

### 1. Auto-cleanup trước khi simulate

Khi gọi `POST /simulate-scenario/:id`, hệ thống sẽ:
- Tự động kiểm tra xem có simulation cũ không
- Xóa tất cả simulations và assignments cũ (nếu có)
- Sau đó mới tạo simulation mới

### 2. Double-check trong transaction

Trước khi insert `SimulatedSurvey`, code sẽ:
- Kiểm tra lại 1 lần nữa trong transaction
- Đảm bảo không có duplicate
- Throw error nếu phát hiện anomaly

### 3. Endpoints mới để quản lý

#### a) Cleanup orphaned simulations
```
POST /scenarios-survey/cleanup-orphaned
```

Xóa tất cả simulations không còn liên kết với scenario

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 3 orphaned simulation(s)",
  "data": {
    "cleaned": 3,
    "orphanedIds": ["id1", "id2", "id3"]
  }
}
```

#### b) Delete specific simulation
```
DELETE /scenarios-survey/delete-simulation/:scenarioId
```

Xóa simulation của 1 scenario cụ thể và reset status về "draft"

**Response:**
```json
{
  "success": true,
  "message": "Simulation deleted successfully"
}
```

## Cách sử dụng

### Workflow bình thường:

1. **Tạo scenario mới**
   ```
   POST /scenarios-survey/create-survey-scenario
   ```

2. **Attach questions**
   ```
   PUT /scenarios-survey/attach-question/:id
   ```

3. **Simulate (tự động xóa data cũ nếu có)**
   ```
   POST /scenarios-survey/simulate-scenario/:id
   ```

### Nếu vẫn gặp lỗi duplicate:

**Cách 1: Cleanup toàn bộ orphaned data**
```
POST /scenarios-survey/cleanup-orphaned
```

**Cách 2: Xóa simulation của scenario cụ thể**
```
DELETE /scenarios-survey/delete-simulation/:scenarioId
```

Sau đó simulate lại:
```
POST /scenarios-survey/simulate-scenario/:id
```

## Database Migration (Optional)

Nếu vẫn gặp vấn đề, có thể cần reset constraint:

```sql
-- Check existing constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'simulated_survey_scenarios'::regclass;

-- Drop old constraint if needed
ALTER TABLE simulated_survey_scenarios 
DROP CONSTRAINT IF EXISTS "REL_80cd28ac231072c3dbc1a2cc80";

-- Recreate with proper naming
ALTER TABLE simulated_survey_scenarios 
ADD CONSTRAINT unique_scenario_simulation 
UNIQUE (scenarioId);
```

## Testing

### Test case 1: Simulate scenario mới
```bash
curl -X POST http://localhost:3000/scenarios-survey/simulate-scenario/:id
```

### Test case 2: Re-simulate (auto cleanup)
```bash
# Lần 1
curl -X POST http://localhost:3000/scenarios-survey/simulate-scenario/:id

# Lần 2 (sẽ tự động xóa lần 1 và tạo mới)
curl -X POST http://localhost:3000/scenarios-survey/simulate-scenario/:id
```

### Test case 3: Manual cleanup
```bash
# Cleanup orphaned
curl -X POST http://localhost:3000/scenarios-survey/cleanup-orphaned

# Delete specific
curl -X DELETE http://localhost:3000/scenarios-survey/delete-simulation/:id
```

## Lưu ý

- ✅ Code hiện tại cho phép **simulate lại nhiều lần** tự động
- ✅ Không cần xóa scenario để simulate lại
- ✅ Data cũ sẽ tự động được cleanup
- ⚠️ Nếu muốn ngăn re-simulation, uncomment code trong controller

## Log để debug

Khi simulate, check console logs:
```
Found 1 existing simulation(s) for scenario abc123. Cleaning up...
Cleanup completed for scenario abc123
```

Nếu thấy log này → hệ thống đã tự động xóa data cũ.

