import {
  GET_ROLLUPS_API,
  ROLLUP_API,
} from "@/constants";
import Rollup, { RollupRequest } from "@/interfaces/rollup";

export async function GetRollups(): Promise<Response> {
  const response = await fetch(GET_ROLLUPS_API, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}

export async function GetRollupByName(name: string): Promise<Response> {
  const response = await fetch(ROLLUP_API + "/" + name, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}

export async function CreateRollup(rollupReq: RollupRequest): Promise<Response> {
  const response = await fetch(ROLLUP_API + "/" + rollupReq.name, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rollupReq),
  });

  return response;
}

export async function DeleteRollup(name: string): Promise<Response> {
  const response = await fetch(ROLLUP_API + "/" + name, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response;
}
