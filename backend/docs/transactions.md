# **Transactions API Documentation**

Base URL: `/api/transactions`

All responses are in JSON format.
All endpoints may return:

* `500 Internal Server Error` with `{ error: string, message?: string }`
  when an unexpected error occurs.

---

## **GET /**

### **Description:**

Retrieve all transactions with optional filters and pagination.

### **Query Parameters:**

| Name          | Type                             | Optional | Description                                      |
| ------------- | -------------------------------- | -------- | ------------------------------------------------ |
| `account_id`  | `string`                         | ✅        | Filter by account ID                             |
| `category_id` | `string`                         | ✅        | Filter by category ID                            |
| `is_tagged`   | `boolean` (`"true"` / `"false"`) | ✅        | Filter by whether the transaction is tagged      |
| `start_date`  | `string` (ISO 8601)              | ✅        | Include only transactions on or after this date  |
| `end_date`    | `string` (ISO 8601)              | ✅        | Include only transactions on or before this date |
| `limit`       | `number`                         | ✅        | Maximum number of transactions to return         |
| `offset`      | `number`                         | ✅        | Number of transactions to skip (default: 0)      |

### **Response:**

```json
{
  "transactions": [ { ...Transaction } ],
  "total": number,
  "limit": number,
  "offset": number
}
```

### **Transaction Object:**

```json
{
  "id": "string",
  "account_id": "string",
  "category_id": "string | null",
  "amount": number,
  "date": "string (ISO 8601)",
  "description": "string",
  "is_tagged": boolean,
  "updated_at": "string (ISO 8601)"
}
```

### **Error Responses:**

* `400 Bad Request`: Invalid query parameters

  ```json
  { "error": "Invalid query parameters", "details": [ ... ] }
  ```

---

## **GET /:id**

### **Description:**

Fetch a single transaction by its unique ID.

### **Path Parameters:**

| Name | Type     | Description    |
| ---- | -------- | -------------- |
| `id` | `string` | Transaction ID |

### **Response:**

```json
{
  "transaction": { ...Transaction }
}
```

### **Error Responses:**

* `404 Not Found`: Transaction not found

  ```json
  { "error": "Transaction not found" }
  ```

---

## **PATCH /:id/tag**

### **Description:**

Tag a transaction by assigning a category and marking it as tagged.

### **Path Parameters:**

| Name | Type     | Description    |
| ---- | -------- | -------------- |
| `id` | `string` | Transaction ID |

### **Request Body:**

```json
{
  "category_id": "string (required)"
}
```

### **Response:**

```json
{
  "success": true,
  "transaction": { ...Transaction }
}
```

### **Error Responses:**

* `400 Bad Request`: Invalid request body

  ````json
  { "error": "Invalid request", "details": [ ... ] } ```
  ````
* `404 Not Found`: Transaction or category not found

  ````json
  { "error": "Transaction not found" } ```
  or  
  ```json
  { "error": "Category not found" } ```
  ````

---

## **GET /stats/cash-flow**

### **Description:**

Compute cash flow statistics (income vs expenses) over a date range.

### **Query Parameters:**

| Name         | Type                | Optional | Description              |
| ------------ | ------------------- | -------- | ------------------------ |
| `start_date` | `string` (ISO 8601) | ✅        | Start date for the range |
| `end_date`   | `string` (ISO 8601) | ✅        | End date for the range   |

### **Response:**

```json
{
  "income": number,          // Sum of negative amounts (converted to positive)
  "expenses": number,        // Sum of positive amounts
  "net": number,             // income - expenses
  "transaction_count": number
}
```

### **Error Responses:**

* `500 Internal Server Error`: Calculation error

  ````json
  { "error": "Failed to calculate cash flow" } ```
  ````

---

## **Data Model Overview**

### **Transaction**

| Field         | Type              | Description                           |
| ------------- | ----------------- | ------------------------------------- |
| `id`          | string            | Unique transaction identifier         |
| `account_id`  | string            | Account this transaction belongs to   |
| `category_id` | string or null    | Associated category                   |
| `amount`      | number            | Positive = expense, Negative = income |
| `date`        | string (ISO 8601) | Transaction date                      |
| `description` | string            | Transaction description               |
| `is_tagged`   | boolean           | Whether it’s categorized              |
| `updated_at`  | string (ISO 8601) | Last modified timestamp               |

### **Category**

| Field  | Type   | Description                |
| ------ | ------ | -------------------------- |
| `id`   | string | Unique category identifier |
| `name` | string | Category name              |
