<?php

require_once __DIR__ . '/../services/SearchService.php';
require_once __DIR__ . '/../core/InputValidator.php';
require_once __DIR__ . '/../core/helpers.php';

class SearchController
{
    private SearchService $search;

    public function __construct(PDO $db)
    {
        $this->search = new SearchService($db);
    }

    public function index(): void
    {
        $query = InputValidator::string(['q' => requestQuery('q')], 'q', 'recherche', false, 120) ?? '';
        $limit = InputValidator::integer(['limit' => requestQuery('limit')], 'limit', 'limit', false, 1, 10) ?? 6;
        $results = $this->search->globalSearch($query, $limit);

        jsonResponse([
            'status' => 'success',
            'data' => $results,
            'results' => $results,
        ]);
    }
}
