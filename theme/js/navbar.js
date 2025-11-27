(function () {

  var Navbar = {

    baseApiUrl : getBaseApiUrl(),
    baseUIUrl : getBaseUIUrl(),

    init : function() {

      ///////////////////////////
      // Navbar

      // get current day/season info from API /today
      var modeUrl = this.baseApiUrl + '/mode';
      fetch(modeUrl)
      .then(res => res.json())
      .then((modeApiResult) => {

        if (!modeApiResult.hasOwnProperty('season')) {
          throw "Could not find required property (season) in response from /mode API";
        }

        var seasonCount = modeApiResult.season + 1;

        // --- Populate Season Dropdown ---
        var navbarSeasonDropdown = document.getElementById('navbar-season-dropdown-menu');
        if (seasonCount > 12) {
          // Multi-column setup for 13+ seasons
          navbarSeasonDropdown.style.width = '320px';
          var row = document.createElement('div');
          row.className = 'row';
          var col1 = document.createElement('ul');
          col1.className = 'list-unstyled col-md-6';
          var col2 = document.createElement('ul');
          col2.className = 'list-unstyled col-md-6';
          row.appendChild(col1);
          row.appendChild(col2);
          navbarSeasonDropdown.appendChild(row);

          for (var s0 = 0; s0 < seasonCount; s0++) {
            var sp1 = s0 + 1;
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = baseUIUrl + '/season.html?which_season=' + sp1;
            a.innerHTML = 'Season ' + sp1;
            li.appendChild(a);
            if (s0 < 12) {
              col1.appendChild(li);
            } else {
              col2.appendChild(li);
            }
          }
        } else {
          // Single-column setup for 1-12 seasons
          for (var s0 = 0; s0 < seasonCount; s0++) {
            var sp1 = s0 + 1;
            var a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = baseUIUrl + '/season.html?which_season=' + sp1;
            a.innerHTML = 'Season ' + sp1;
            navbarSeasonDropdown.appendChild(a);
          }
        }

        // --- Populate Postseason Dropdown (Identical Logic) ---
        var navbarPostseasonDropdown = document.getElementById('navbar-postseason-dropdown-menu');
        if (seasonCount > 12) {
          // Multi-column setup for 13+ seasons
          navbarPostseasonDropdown.style.width = '320px';
          var p_row = document.createElement('div');
          p_row.className = 'row';
          var p_col1 = document.createElement('ul');
          p_col1.className = 'list-unstyled col-md-6';
          var p_col2 = document.createElement('ul');
          p_col2.className = 'list-unstyled col-md-6';
          p_row.appendChild(p_col1);
          p_row.appendChild(p_col2);
          navbarPostseasonDropdown.appendChild(p_row);

          for (var s0 = 0; s0 < seasonCount; s0++) {
            var sp1 = s0 + 1;
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = baseUIUrl + '/postseason.html?which_season=' + sp1;
            a.innerHTML = 'Season ' + sp1;
            li.appendChild(a);
            if (s0 < 12) {
              p_col1.appendChild(li);
            } else {
              p_col2.appendChild(li);
            }
          }
        } else {
          // Single-column setup for 1-12 seasons
          for (var s0 = 0; s0 < seasonCount; s0++) {
            var sp1 = s0 + 1;
            var a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = baseUIUrl + '/postseason.html?which_season=' + sp1;
            a.innerHTML = 'Season ' + sp1;
            navbarPostseasonDropdown.appendChild(a);
          }
        }
      })
      .catch(err => {
        console.log('Encountered an error while calling /mode');
        console.log(err);
      }); // end /seeds api call
    },

    /**
     * Register Event
     */
    registerEvent : function (element, event, handler, capture) {
      if (/msie/i.test(navigator.userAgent)) {
        element.attachEvent('on' + event, handler);
      } else {
        element.addEventListener(event, handler, capture);
      }
    },

  };

  Navbar.registerEvent(window, 'load', function () {
    Navbar.init();
  }, false);

}());