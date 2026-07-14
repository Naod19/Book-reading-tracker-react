import { useState, useEffect } from "react";
import "./BookTracker.css";
import { Search, X, CirclePlus } from "lucide-react";

function BookTracker() {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [book, setBook] = useState([]);
  const [collection, setCollection] = useState(() => {
    try {
      const saved = localStorage.getItem("collection");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchCollection, setSearchCollection] = useState("");
  const [filtered, setFiltered] = useState("default");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    localStorage.setItem("collection", JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = setTimeout(() => {
      setNotification("");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [notification]);

  useEffect(() => {
    if (!searchTerm) return;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}`;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const signal = controller.signal;
      try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error("Couldn't connect to server");
        }
        const bookData = await response.json();
        setBook(bookData.docs || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message);
          console.log(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [searchTerm]);

  const handleSearch = () => {
    if (inputValue.trim()) setSearchTerm(inputValue);
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setBook([]);
  };

  const handleCollection = (item) => {
    if (!item) return;

    const isDuplicate = collection?.some((col) => col.id === item.key);

    if (isDuplicate) {
      setNotification("Book is already added");
      return;
    }
    const bookInfo = {
      id: item.key,
      title: item.title,
      author: item.author_name ? item.author_name.join(", ") : "Unknown Author",
      status: "not-started",
    };

    setCollection((prev) => [...prev, bookInfo]);
    setNotification("Book added to collection");
  };

  const handleRemove = (id) => {
    setCollection((prev) => prev.filter((book) => book.id !== id));
    setNotification("Book has been removed from collection");
  };

  const handleStatus = (bookId, newStatus) => {
    const updatedCollection = collection.map((item) => {
      if (item.id === bookId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setCollection(updatedCollection);
    setNotification(`Book Status has been updated to ${newStatus}`);
  };

  const displayedCollection = collection
    .filter((book) => {
      const term = searchCollection.trim().toLowerCase();

      if (!term) return true;

      return (
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term)
      );
    })
    .filter((item) => {
      if (filtered === "default") return true;

      if (filtered === "read") return item.status === "read";

      if (filtered === "favorites") return item.status === "favorites";

      if (filtered === "active") return item.status === "not-started";
    });

  return (
    <div className="container">
      {notification && (
        <div className="notification">
          <span>{notification}</span>
        </div>
      )}
      <h1>Track Your Reading Habits</h1>
      <div className="input-container">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search book or author"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <div className="icon-container">
          <button className="search-icon" onClick={handleSearch}>
            <Search />
            <span>Search</span>
          </button>
          <button onClick={handleClearSearch} className="clear-icon">
            <X />
            <span>Clear</span>
          </button>
        </div>
      </div>
      <div className="book-display">
        {error && <p>{error}</p>}
        {searchTerm === "" ? (
          <p>Type something...</p>
        ) : loading ? (
          <div className="loading-container">
            <div className="loading"></div>
            <p>Finding "{searchTerm}"</p>
          </div>
        ) : book.length > 0 && !loading ? (
          book.slice(0, 10).map((item) => (
            <div key={item.key} className="book-card">
              <div className="book-info">
                <h3>Title: {item.title}</h3>
                <h4>
                  Author:{" "}
                  {item.author_name ? item.author_name.join(", ") : "Unknown"}
                </h4>
              </div>
              <CirclePlus
                className="add-btn"
                onClick={() => handleCollection(item)}
              />
            </div>
          ))
        ) : (
          <p>{searchTerm} was not found</p>
        )}
      </div>
      <div className="collection">
        {collection && (
          <>
            <h2>Collections {collection.length}</h2>
            <input
              placeholder="Search saved book"
              value={searchCollection}
              onChange={(e) => setSearchCollection(e.target.value)}
              className="collection-search"
            />
            <select
              value={filtered}
              onChange={(e) => setFiltered(e.target.value)}
            >
              <option value="default">Filter By</option>
              <option value="read">Read</option>
              <option value="favorites">Favorites</option>
              <option value="active">Not Started</option>
            </select>
            {collection.length > 0 ? (
              displayedCollection.length === 0 ? (
                <p>No book found</p>
              ) : (
                displayedCollection.map((item) => (
                  <div key={item.id} className="collection-item">
                    <div className="book-info">
                      <h3>Title: {item.title}</h3>
                      <h4>Author: {item.author}</h4>
                    </div>
                    <div className="action-btns">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatus(item.id, e.target.value)}
                      >
                        <option value="not-started">Not started</option>
                        <option value="read">Read</option>
                        <option value="favorites">Favorites</option>
                      </select>
                      <button
                        onClick={() => {
                          handleRemove(item.id);
                        }}
                      >
                        Remove from collection
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              <p>No book to display. Start adding to see your collection</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookTracker;
