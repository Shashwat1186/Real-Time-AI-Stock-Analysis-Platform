"use client"

import { useEffect, useRef, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks = [] }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [defaultStocks, setDefaultStocks] = useState<StockWithWatchlistStatus[]>(initialStocks || []);
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks || []);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : defaultStocks?.slice(0, 10);

    useEffect(() => {
        if (renderAs === 'trigger-text' || renderAs === 'trigger-button') return;

        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        const onOpenSearch = () => setOpen(true);
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("open-search", onOpenSearch)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("open-search", onOpenSearch)
        }
    }, [renderAs])

    const requestIdRef = useRef(0);
    const handleSearch = async () => {
        if (!isSearchMode) {
            if (defaultStocks.length === 0) {
                setLoading(true)
                try {
                    const results = await searchStocks("");
                    setDefaultStocks(results);
                    setStocks(results);
                } catch {
                    setDefaultStocks([]);
                    setStocks([]);
                } finally {
                    setLoading(false)
                }
            } else {
                setStocks(defaultStocks);
            }
            return;
        }
        const requestId = ++requestIdRef.current;
        setLoading(true)
        try {
            const results = await searchStocks(searchTerm.trim());
            if (requestId === requestIdRef.current) setStocks(results);
        } catch {
            if (requestId === requestIdRef.current) setStocks([])
        } finally {
            if (requestId === requestIdRef.current) setLoading(false)
        }
    }
    const debouncedSearch = useDebounce(handleSearch, 300);
    useEffect(() => {
        debouncedSearch();
    }, [searchTerm]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(defaultStocks);
    }

    if (renderAs === 'trigger-text') {
        return (
            <span onClick={() => window.dispatchEvent(new Event('open-search'))} className="search-text cursor-pointer">
                {label}
            </span>
        )
    }

    if (renderAs === 'trigger-button') {
        return (
            <Button onClick={() => window.dispatchEvent(new Event('open-search'))} className="search-btn">
                {label}
            </Button>
        )
    }

    return (
        <>
            {renderAs === 'text' && (
                <span onClick={() => setOpen(true)} className="search-text cursor-pointer">
                    {label}
                </span>
            )}

            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
                    {loading && <Loader2 className="search-loader" />}
                </div>
                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count">
                                {isSearchMode ? 'Search results' : 'Popular stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock, i) => (
                                <li key={`${stock.symbol}-${i}`} className="search-item">
                                    <Link
                                        href={`/${stock.symbol}`}
                                        onClick={handleSelectStock}
                                        className="search-item-link"
                                    >
                                        <TrendingUp className="h-4 w-4 text-gray-500" />
                                        <div className="flex-1">
                                            <div className="search-item-name">
                                                {stock.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {stock.symbol} | {stock.exchange} | {stock.type}
                                            </div>
                                        </div>
                                        {/*<Star />*/}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )
                    }
                </CommandList>
            </CommandDialog>
        </>
    )
}