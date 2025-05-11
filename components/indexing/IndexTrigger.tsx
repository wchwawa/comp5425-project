"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function IndexingTrigger() {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleIndexing = async () => {
		try {
			setLoading(true);
			setMessage("indexing...");
			const response = await fetch("/api/indexing", {
				method: "POST",
			});
			const data = await response.json();

			if (data.success) {
				setMessage("indexing completed");
			} else {
				setMessage(`indexing failed: ${data.message}`);
			}
		} catch (error) {
			setMessage(`request error: ${error}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		//change disable back while needs to indexing
		<div>	 
			<Button disabled={loading} onClick={handleIndexing} >
				{loading ? "indexing..." : "index podcast data set"}
			</Button>
			{message && <p className="mt-2">{message}</p>}
		</div>	
	);
}
