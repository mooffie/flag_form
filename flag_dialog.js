(function ($) {

Drupal.behaviors.flagDialog = {
  attach: function (context, settings) {
    Drupal.behaviors.dialog.attach(context, settings); // Ensure Drupal.dialog exists.
    $('body').once('flag-dialog', function() {
      Drupal.dialog.bind('dialogopen', function() {

        // When the user presses ENTER (in textfields or selects), the browser
        // submits the form. We want this submission to occur via ajax. So we
        // intercept a normal form submission and instead trigger the first
        // ajaxified action button.
        Drupal.dialog.find('form').submit(function() {
          if ($('#autocomplete').size() == 0) { // Pressing ENTER in autocompletes shouldn't submit the form.
            $('.form-actions input:submit:first', this).mousedown();
          }
          return false;
        });

        // We handle "Cancel" buttons directly through JavaScript to save
        // a roundtrip to the server.
        Drupal.dialog.find('.form-actions input[id*=cancel]').click(function() {
          Drupal.dialog.dialog('close');
          return false;
        });

      });

      Drupal.dialog.bind('dialogbeforeclose', function() {
        // Pressing ESC in autocompletes shouldn't close the dialog.
        return $('#autocomplete').size() == 0;
      });

      // A fix for autocompletes:
      //
      // Normally, clicking an option in an autocomplete closes the selectbox.
      // It's done indirectly: by a blur() event happening to the inputbox. But
      // this doesn't happen inside a Dialog (either because of processing
      // Dialog does with tab-related events, or because of a clash with its
      // drag-resize system). So we close autocompletes explicitly.
      $('#autocomplete').live('mousedown', function() {
        this.owner.hidePopup();
      });

      // @todo: Drupal.tableDrag fails to hide column headers correctly. The
      // problem seems to be in initColumns:
      //
      //   var headerIndex = $('> td:not(:hidden)', cell.parent()).index(cell.get(0)) + 1;
      //
      // It seems everything is :hidden; that attachBehaviors is called before
      // content is visible. If we can reproduce this just by putting a table
      // inside a hidden div then this should be fixed in Core, not here.
    });
  }
};

Drupal.flagUtils = Drupal.flagUtils || {};

/**
 * Updates all links of a certain content ID.
 *
 * @param data
 *   A parcel of info usually returned from the server; at a minimum it should
 *   contain:
 *   - flagName
 *   - contentId
 *   - newLink
 *
 * @todo: The masses are clamoring for this utility function (see
 * http://drupal.org/node/843308#comment-3308744), so move it to Flag's core.
 */
Drupal.flagUtils.updateContentIdLinks = function(data) {

  var $wrappers = $('.flag-wrapper.flag-' + data.flagName + '-' + data.contentId);

  var $newLink = $(data.newLink);
  // Initially hide the message so we can fade it in.
  $('.flag-message', $newLink).css('display', 'none');

  $wrappers = $newLink.replaceAll($wrappers);
  $('.flag-message', $wrappers).fadeIn();

  Drupal.attachBehaviors($wrappers.parent());

  setTimeout(function() { $('.flag-message', $wrappers).fadeOut() }, 3000);

  // A short treatise on Replacing Things.
  //
  //   $olds.replaceWith($new)
  //
  // This replaces all $olds with a single $new. The $olds variable now contains
  // a collection of elements that are no longer in the document.
  //
  //   $new.replaceAll($olds)
  //
  // This replaces all $olds with clones of $new. The value of this expression is
  // a collection of all new $new's.
  //
  // @todo: Remove this explanation?
}

/**
 * Ajax command to update a flag link.
 */
Drupal.ajax.prototype.commands.flag_dialog_update_link = function(ajax, response, status) {
  Drupal.flagUtils.updateContentIdLinks(response);
  // @todo: Trigger a flagGlobal{Before,After}LinkUpdate event. But first we'd
  // better have a fully populated 'response' parcel; see comment in flag_dialog_command_update_link().
};

})(jQuery);
