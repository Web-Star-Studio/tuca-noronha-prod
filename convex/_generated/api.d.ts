/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activities from "../activities.js";
import type * as auth from "../auth.js";
import type * as clerk from "../clerk.js";
import type * as domains_activities_index from "../domains/activities/index.js";
import type * as domains_activities_mutations from "../domains/activities/mutations.js";
import type * as domains_activities_queries from "../domains/activities/queries.js";
import type * as domains_activities_types from "../domains/activities/types.js";
import type * as domains_activities_utils from "../domains/activities/utils.js";
import type * as domains_events_index from "../domains/events/index.js";
import type * as domains_events_mutations from "../domains/events/mutations.js";
import type * as domains_events_queries from "../domains/events/queries.js";
import type * as domains_events_types from "../domains/events/types.js";
import type * as domains_events_utils from "../domains/events/utils.js";
import type * as domains_index from "../domains/index.js";
import type * as domains_media_index from "../domains/media/index.js";
import type * as domains_media_mutations from "../domains/media/mutations.js";
import type * as domains_media_queries from "../domains/media/queries.js";
import type * as domains_media_types from "../domains/media/types.js";
import type * as domains_media_utils from "../domains/media/utils.js";
import type * as domains_restaurants_types from "../domains/restaurants/types.js";
import type * as domains_users_index from "../domains/users/index.js";
import type * as domains_users_mutations from "../domains/users/mutations.js";
import type * as domains_users_queries from "../domains/users/queries.js";
import type * as domains_users_types from "../domains/users/types.js";
import type * as domains_users_utils from "../domains/users/utils.js";
import type * as events from "../events.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as media from "../media.js";
import type * as rbac from "../rbac.js";
import type * as restaurants from "../restaurants.js";
import type * as shared_index from "../shared/index.js";
import type * as shared_rbac from "../shared/rbac.js";
import type * as types from "../types.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  auth: typeof auth;
  clerk: typeof clerk;
  "domains/activities/index": typeof domains_activities_index;
  "domains/activities/mutations": typeof domains_activities_mutations;
  "domains/activities/queries": typeof domains_activities_queries;
  "domains/activities/types": typeof domains_activities_types;
  "domains/activities/utils": typeof domains_activities_utils;
  "domains/events/index": typeof domains_events_index;
  "domains/events/mutations": typeof domains_events_mutations;
  "domains/events/queries": typeof domains_events_queries;
  "domains/events/types": typeof domains_events_types;
  "domains/events/utils": typeof domains_events_utils;
  "domains/index": typeof domains_index;
  "domains/media/index": typeof domains_media_index;
  "domains/media/mutations": typeof domains_media_mutations;
  "domains/media/queries": typeof domains_media_queries;
  "domains/media/types": typeof domains_media_types;
  "domains/media/utils": typeof domains_media_utils;
  "domains/restaurants/types": typeof domains_restaurants_types;
  "domains/users/index": typeof domains_users_index;
  "domains/users/mutations": typeof domains_users_mutations;
  "domains/users/queries": typeof domains_users_queries;
  "domains/users/types": typeof domains_users_types;
  "domains/users/utils": typeof domains_users_utils;
  events: typeof events;
  functions: typeof functions;
  http: typeof http;
  media: typeof media;
  rbac: typeof rbac;
  restaurants: typeof restaurants;
  "shared/index": typeof shared_index;
  "shared/rbac": typeof shared_rbac;
  types: typeof types;
  userPreferences: typeof userPreferences;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
