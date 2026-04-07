import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
	credentials: {
		accessKeyId: process.env.APP_AWS_ACCESS_KEY ?? "",
		secretAccessKey: process.env.APP_AWS_SECRET_KEY ?? "",
	},
	region: process.env.APP_AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

export interface AppUser {
	UserEmail: string;
	IsBanned: boolean;
	accessToken: string;
	refreshToken: string;
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
		try {
			const result = await docClient.send(
				new GetCommand({
					TableName: process.env.APP_AWS_TABLE_NAME,
					Key: { UserEmail: email },
				})
			);
			return result.Item ? (result.Item as AppUser) : null;
		} catch (error) {
			console.log("DynamoDb.getUser error", error);
			return null;
		}
	},

	isBanned: async (email: string | null | undefined): Promise<boolean> => {
		if (!email) return false;
		console.log("Checking if isBanned:true for", email);
		// Do NOT catch here — let the error propagate so callers can fail closed
		// (deny access) rather than fail open (allow banned users through).
		const result = await docClient.send(
			new GetCommand({
				TableName: process.env.APP_AWS_TABLE_NAME,
				Key: { UserEmail: email },
			})
		);
		return result.Item ? (result.Item as AppUser).IsBanned : false;
	},

	setbanUser: async (email: string, isbanned: boolean): Promise<boolean> => {
		console.log("Banning (set isBanned:" + isbanned + ") for", email);
		try {
			await docClient.send(
				new UpdateCommand({
					TableName: process.env.APP_AWS_TABLE_NAME,
					Key: { UserEmail: email },
					UpdateExpression: "SET IsBanned = :banned",
					ExpressionAttributeValues: { ":banned": isbanned },
					ReturnValues: "NONE",
				})
			);
			return true;
		} catch (error) {
			console.log("DynamoDb.setbanUser error", error);
			return false;
		}
	},

	saveUser: async (user: AppUser): Promise<AppUser | null> => {
		// Log only the email — never log access/refresh tokens.
		console.log("Saving user", user.UserEmail);
		try {
			await docClient.send(
				new PutCommand({
					TableName: process.env.APP_AWS_TABLE_NAME,
					Item: user,
				})
			);
			return user;
		} catch (error) {
			console.log("DynamoDb.saveUser error", error);
			return null;
		}
	},
};
