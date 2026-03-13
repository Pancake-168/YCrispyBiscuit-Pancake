import { API_URLS } from "@/apiUrls";
import { useWechatStore } from "@/stores/WeChat";
import type { GetOverViewDetailResponse, GetOverViewDetailResult, GetOverViewResponse, GetOverViewResult } from "@/types/OverView";

const PAGE_SIZE = 20;

// Overview get请求（分页查询，全量拉取）
//已使用
export async function GetOverView(appid: string): Promise<GetOverViewResult> {
	const wechatStore = useWechatStore();
	const token = wechatStore.ssoParams.loginToken || '';

	const fetchPage = async (page: number): Promise<{ ok: boolean; data: GetOverViewResponse | null }> => {
		try {
			const res = await fetch(API_URLS.GetOverView(appid, page, PAGE_SIZE), {
				method: 'GET',
				headers: {
					'accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
			if (!res.ok) return { ok: false, data: null };
			const data = (await res.json().catch(() => null)) as GetOverViewResponse | null;
			return { ok: true, data };
		} catch (error) {
			console.warn('[System:OverView:GetOverView] fetchPage 报错:', error);
			return { ok: false, data: null };
		}
	};

	try {
		const first = await fetchPage(1);
		if (!first.ok || !first.data) return { ok: false, data: first.data };

		const firstPage = first.data;
		const firstList = Array.isArray(firstPage?.data) ? firstPage?.data : [];
		let allData = [...firstList];
		const totalPage = Number(firstPage?.meta?.totalPage ?? 1);

		if (totalPage > 1) {
			const promises: Array<Promise<{ ok: boolean; data: GetOverViewResponse | null }>> = [];
			for (let p = 2; p <= totalPage; p++) {
				promises.push(fetchPage(p));
			}

			const results = await Promise.all(promises);
			results.forEach(r => {
				const items = Array.isArray(r.data?.data) ? r.data.data : [];
				if (items.length) allData = allData.concat(items);
			});
		}

		return {
			ok: true,
			data: {
				...firstPage,
				data: allData,
				meta: {
					...(firstPage?.meta || {}),
					page: 1,
					totalPage: 1,
					count: allData.length
				}
			}
		} satisfies GetOverViewResult;
	} catch (error) {
		console.warn('[System:OverView:GetOverView] 报错:', error);
		return { ok: false, data: null };
	}
}




//已使用
// Overview Detail get请求
export async function GetOverViewDetail(appid: string, atype: string, id: number): Promise<GetOverViewDetailResult> {
	const wechatStore = useWechatStore();
	const token = wechatStore.ssoParams.loginToken || '';


	console.log('调用 GetOverViewDetail 参数:', { appid, atype, id });

	try {
		const res = await fetch(API_URLS.GetOverViewDetail(appid, atype, id), {
			method: 'GET',
			headers: {
				'accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});
		
		const data = (await res.json().catch(() => null)) as GetOverViewDetailResponse | null;
		console.log('GetOverViewDetail 返回数据:', data);
		return { ok: res.ok, data } satisfies GetOverViewDetailResult;
	} catch (error) {
		console.error('GetOverViewDetail 报错:', error);
		return { ok: false, data: null };
	}
}


