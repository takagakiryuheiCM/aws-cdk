import * as cdk from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class LambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

   // dynamoDBのテーブルを定義
   // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html
   const productTable = new Table(this, "Products", {
    partitionKey: {
      name: "product_id", 
      type: AttributeType.STRING
    },

    tableName: "Products",
    removalPolicy: cdk.RemovalPolicy.DESTROY 
    })

   // TSで記述されたlambdaをjsにトランスパイルし、ラムダ関数を作成する。
   // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html
   const lambdaFunc = new NodejsFunction(this, "Function", {
    entry: "lib/lambda/products.ts",
    runtime: Runtime.NODEJS_20_X,
  });

    // 権限付与
    productTable.grantReadWriteData(lambdaFunc)

    // HttpApiを作成
    const api = new HttpApi(this, "ProductGateway", {
      apiName: "Product API",
    });

    // Lambda関数への統合を作成
    const lambdaIntegration = new HttpLambdaIntegration("LambdaIntegration", lambdaFunc);

    // ルーティングを作成
    api.addRoutes({
      path: '/products',
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET, cdk.aws_apigatewayv2.HttpMethod.POST],
      integration: lambdaIntegration,
    });

    api.addRoutes({
      path: '/products/{product_id}',
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET, cdk.aws_apigatewayv2.HttpMethod.DELETE],
      integration: lambdaIntegration,
    });
  }
}
