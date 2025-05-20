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
import type * as auth from "../auth.js";
import type * as clerk from "../clerk.js";
import type * as domains_activities_index from "../domains/activities/index.js";
import type * as domains_activities_mutations from "../domains/activities/mutations.js";
import type * as domains_activities_queries from "../domains/activities/queries.js";
import type * as domains_activities_types from "../domains/activities/types.js";
import type * as domains_activities_utils from "../domains/activities/utils.js";
import type * as domains_events_actions from "../domains/events/actions.js";
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
import type * as domains_rbac_action from "../domains/rbac/action.js";
import type * as domains_rbac_functions from "../domains/rbac/functions.js";
import type * as domains_rbac_index from "../domains/rbac/index.js";
import type * as domains_rbac_mutation from "../domains/rbac/mutation.js";
import type * as domains_rbac_mutations from "../domains/rbac/mutations.js";
import type * as domains_rbac_queries from "../domains/rbac/queries.js";
import type * as domains_rbac_query from "../domains/rbac/query.js";
import type * as domains_rbac_types from "../domains/rbac/types.js";
import type * as domains_rbac_utils from "../domains/rbac/utils.js";
import type * as domains_restaurants_index from "../domains/restaurants/index.js";
import type * as domains_restaurants_mutations from "../domains/restaurants/mutations.js";
import type * as domains_restaurants_queries from "../domains/restaurants/queries.js";
import type * as domains_restaurants_types from "../domains/restaurants/types.js";
import type * as domains_restaurants_utils from "../domains/restaurants/utils.js";
import type * as domains_users_index from "../domains/users/index.js";
import type * as domains_users_mutations from "../domains/users/mutations.js";
import type * as domains_users_queries from "../domains/users/queries.js";
import type * as domains_users_types from "../domains/users/types.js";
import type * as domains_users_utils from "../domains/users/utils.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as rbac from "../rbac.js";
import type * as shared_index from "../shared/index.js";
import type * as shared_rbac from "../shared/rbac.js";
import type * as types from "../types.js";
import type * as userPreferences from "../userPreferences.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  clerk: typeof clerk;
  "domains/activities/index": typeof domains_activities_index;
  "domains/activities/mutations": typeof domains_activities_mutations;
  "domains/activities/queries": typeof domains_activities_queries;
  "domains/activities/types": typeof domains_activities_types;
  "domains/activities/utils": typeof domains_activities_utils;
  "domains/events/actions": typeof domains_events_actions;
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
  "domains/rbac/action": typeof domains_rbac_action;
  "domains/rbac/functions": typeof domains_rbac_functions;
  "domains/rbac/index": typeof domains_rbac_index;
  "domains/rbac/mutation": typeof domains_rbac_mutation;
  "domains/rbac/mutations": typeof domains_rbac_mutations;
  "domains/rbac/queries": typeof domains_rbac_queries;
  "domains/rbac/query": typeof domains_rbac_query;
  "domains/rbac/types": typeof domains_rbac_types;
  "domains/rbac/utils": typeof domains_rbac_utils;
  "domains/restaurants/index": typeof domains_restaurants_index;
  "domains/restaurants/mutations": typeof domains_restaurants_mutations;
  "domains/restaurants/queries": typeof domains_restaurants_queries;
  "domains/restaurants/types": typeof domains_restaurants_types;
  "domains/restaurants/utils": typeof domains_restaurants_utils;
  "domains/users/index": typeof domains_users_index;
  "domains/users/mutations": typeof domains_users_mutations;
  "domains/users/queries": typeof domains_users_queries;
  "domains/users/types": typeof domains_users_types;
  "domains/users/utils": typeof domains_users_utils;
  functions: typeof functions;
  http: typeof http;
  rbac: typeof rbac;
  "shared/index": typeof shared_index;
  "shared/rbac": typeof shared_rbac;
  types: typeof types;
  userPreferences: typeof userPreferences;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
