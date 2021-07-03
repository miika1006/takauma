import aws from "aws-sdk";

const client = new aws.DynamoDB.DocumentClient({
	accessKeyId: process.env.APP_AWS_ACCESS_KEY,
	secretAccessKey: process.env.APP_AWS_SECRET_KEY,
	region: process.env.APP_AWS_REGION,
});

export interface AppUser {
	UserEmail: string;
	IsBanned: boolean;
}
export interface Dynamo {
	saveUser: (user: AppUser) => Promise<AppUser | null>;
	getUser: (email: string) => Promise<AppUser | null>;
	isBanned: (email: string | null | undefined) => Promise<boolean>;
	setbanUser: (email: string, isbanned: boolean) => Promise<boolean>;
}
export const dynamo: Dynamo = {
	getUser: async (email: string): Promise<AppUser | null> => {
		console.log("Getting user by email", email);
		const result = await client
			.get({
				TableName: process.env.APP_AWS_TABLE_NAME,
				Key: {
					UserEmail: email,
				},
			})
			.promise();
		if (result?.$response?.error) {
			console.log("DynamoDb.getUserByEmail error", result.$response.error);
		}
		const { Item } = result;
		return Item ? (Item as AppUser) : null;
	},
	isBanned: async (email: string | null | undefined) => {
		if (!email) return false;
		console.log("Checking if isBanned:true for", email);
		const result = await client
			.get({
				TableName: process.env.APP_AWS_TABLE_NAME,
				Key: {
					UserEmail: email,
				},
			})
			.promise();
		if (result?.$response?.error) {
			console.log("DynamoDb.getUserByEmail error", result.$response.error);
		}
		const { Item } = result;
		return Item ? (Item as AppUser).IsBanned : false;
	},
	setbanUser: async (email: string, isbanned: boolean) => {
		console.log("Banning (set isBanned:" + isbanned + ") for", email);
		const result = await client
			.update({
				TableName: process.env.APP_AWS_TABLE_NAME,
				Key: {
					UserEmail: email,
				},
				UpdateExpression: "SET IsBanned = :banned",
				ExpressionAttributeValues: {
					":banned": isbanned,
				},
				ReturnValues: "NONE",
			})
			.promise();
		if (result?.$response?.error) {
			console.log("DynamoDb.banUser error", result.$response.error);
			return false;
		}
		return true;
	},
	saveUser: async (user: AppUser) => {
		console.log("Saving user", user);
		const result = await client
			.put({
				TableName: process.env.APP_AWS_TABLE_NAME,
				Item: user,
			})
			.promise();
		if (result?.$response?.error) {
			console.log("DynamoDb.saveUser error", result.$response.error);
			return null;
		}
		return user;
	},
	/*get: (params: aws.DynamoDB.DocumentClient.GetItemInput) =>
		client.get(params).promise(),
	put: (params: aws.DynamoDB.DocumentClient.PutItemInput) =>
		client.put(params).promise(),
	query: (params: aws.DynamoDB.DocumentClient.QueryInput) =>
		client.query(params).promise(),
	update: (params: aws.DynamoDB.DocumentClient.UpdateItemInput) =>
		client.update(params).promise(),
	delete: (params: aws.DynamoDB.DocumentClient.DeleteItemInput) =>
		client.delete(params).promise(),*/
};
