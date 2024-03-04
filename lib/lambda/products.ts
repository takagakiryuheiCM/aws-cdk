import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "Products";

export const handler =async (event: any = {}): Promise<any>=> {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  
  let productId = event.pathParameters.product_id

  try {
    switch (event.routeKey) {
      case "DELETE /products/{product_id}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              product_id: productId,
            },
          })
        );
        body = `Deleted product ${productId}`;
        break;
      case "GET /products/{product_id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              product_id: productId,
            },
          })
        );
        body = body.Item;
        break;
      case "GET /products":
        body = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );
        body = body.Items;
        break;
      case "PUT /products":
        let requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              product_id: requestJSON.product_id,
              price: requestJSON.price,
              name: requestJSON.name,
            },
          })
        );
        body = `Put product ${requestJSON.product_id}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    if (err instanceof Error) {
        statusCode = 400;
        body = err.message;
      } else {
        statusCode = 500;
        body = "Internal server error";
      }
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
