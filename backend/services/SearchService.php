<?php

require_once __DIR__ . '/../repositories/SearchRepository.php';

class SearchService
{
    private SearchRepository $search;

    public function __construct(PDO $db)
    {
        $this->search = new SearchRepository($db);
    }

    public function globalSearch(string $query, int $limit = 6): array
    {
        if (trim($query) === '') {
            return [];
        }

        return $this->search->globalSearch($query, $limit);
    }
}
